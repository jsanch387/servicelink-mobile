import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useToast } from '../../../components/ui';
import { fireErrorHaptic, fireSuccessHaptic } from '../../../utils/feedbackHaptics';
import { useAuth } from '../../auth';
import { postBookingAction } from '../api/postBookingAction';
import {
  BOOKING_ACTION,
  isOnTheWayActionDone,
  JOB_STATUS,
  normalizeJobStatus,
} from '../constants/jobStatus';
import { bookingsDetailsQueryKey } from '../queryKeys';
import { homeBookingsUpcomingQueryKey } from '../../home/queryKeys';
import { invalidateBookingCachesAfterAction } from '../utils/invalidateBookingCachesAfterAction';
import { patchBookingJobStatusInDetailsCache } from '../utils/patchBookingJobStatusInDetailsCache';
import { patchBookingJobStatusInHomeCache } from '../utils/patchBookingJobStatusInHomeCache';
import { isBookingActionConflictError } from '../utils/bookingActionErrors';
import { showBookingActionToasts } from '../utils/bookingActionFeedback';

const FALLBACK_ERROR = 'Couldn’t update the appointment. Try again.';

/**
 * @param {import('@tanstack/react-query').QueryClient} queryClient
 * @param {string | null | undefined} businessId
 * @param {string} bookingId
 * @returns {string | null}
 */
function readJobStatusFromCaches(queryClient, businessId, bookingId) {
  const details = queryClient.getQueryData(bookingsDetailsQueryKey(bookingId));
  if (details && typeof details === 'object' && 'job_status' in details) {
    return normalizeJobStatus(details.job_status);
  }
  if (businessId) {
    const home = queryClient.getQueryData(homeBookingsUpcomingQueryKey(businessId));
    if (home?.next?.id === bookingId) {
      return normalizeJobStatus(home.next.job_status);
    }
  }
  return null;
}

/**
 * Owner-triggered booking actions (`on_the_way`, `job_started`, `work_finished`).
 * Mark complete uses {@link useMarkBookingCompleteFlow} → `job_completed` with checkout payload.
 * State transitions are server-owned; the app patches `job_status` optimistically.
 *
 * @param {string | null | undefined} businessId Used for home cache reads/writes.
 */
export function useBookingAction(businessId) {
  const { session } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const token = session?.access_token ?? null;
  const [cooldownUntil, setCooldownUntil] = useState(0);
  /** bookingId → job_status applied this session (survives brief stale refetches). */
  const jobStatusSessionRef = useRef(new Map());
  const [, bumpSession] = useState(0);

  useEffect(() => {
    if (cooldownUntil <= Date.now()) {
      return undefined;
    }
    const timer = setTimeout(() => setCooldownUntil(0), cooldownUntil - Date.now());
    return () => clearTimeout(timer);
  }, [cooldownUntil]);

  const patchJobStatusInCache = useCallback(
    (bookingId, jobStatus, bookingStatus = null, workHandoffStatus = undefined) => {
      if (!bookingId?.trim() || !jobStatus?.trim()) {
        return;
      }
      jobStatusSessionRef.current.set(bookingId.trim(), jobStatus.trim());
      bumpSession((n) => n + 1);
      patchBookingJobStatusInHomeCache(
        queryClient,
        businessId,
        bookingId,
        jobStatus,
        bookingStatus,
        workHandoffStatus,
      );
      patchBookingJobStatusInDetailsCache(
        queryClient,
        bookingId,
        jobStatus,
        bookingStatus,
        workHandoffStatus,
      );
    },
    [businessId, queryClient],
  );

  const getJobStatus = useCallback(
    (bookingId) => {
      if (!bookingId?.trim()) {
        return null;
      }
      const id = bookingId.trim();
      const sessionStatus = jobStatusSessionRef.current.get(id);
      if (sessionStatus) {
        return sessionStatus;
      }
      return readJobStatusFromCaches(queryClient, businessId, id);
    },
    [businessId, queryClient],
  );

  const isOnTheWayDone = useCallback(
    (bookingId, booking) => {
      const fromBooking = booking ? isOnTheWayActionDone(booking) : false;
      if (fromBooking) {
        return true;
      }
      const status = getJobStatus(bookingId);
      return status != null && status !== JOB_STATUS.NOT_STARTED;
    },
    [getJobStatus],
  );

  const isJobStartedDone = useCallback(
    (bookingId, booking) => {
      const status = booking
        ? normalizeJobStatus(booking.job_status)
        : normalizeJobStatus(getJobStatus(bookingId));
      return status === JOB_STATUS.IN_PROGRESS || status === JOB_STATUS.COMPLETED;
    },
    [getJobStatus],
  );

  const isJobCompletedDone = useCallback(
    (bookingId, booking) => {
      const status = booking
        ? normalizeJobStatus(booking.job_status)
        : normalizeJobStatus(getJobStatus(bookingId));
      return status === JOB_STATUS.COMPLETED;
    },
    [getJobStatus],
  );

  const mutation = useMutation({
    mutationFn: ({ bookingId, action, notify }) =>
      postBookingAction(token, bookingId, action, { notify }),
    onSuccess: async (res, { bookingId, action, notify, suppressUiFeedback }) => {
      if (res.ok) {
        patchJobStatusInCache(bookingId, res.jobStatus, res.bookingStatus, res.workHandoffStatus);
        void invalidateBookingCachesAfterAction(queryClient, bookingId);
        if (suppressUiFeedback) {
          return;
        }
        fireSuccessHaptic();
        if (
          (action === BOOKING_ACTION.WORK_FINISHED || action === BOOKING_ACTION.ON_THE_WAY) &&
          notify !== true
        ) {
          return;
        }
        showBookingActionToasts(toast, action, res);
        return;
      }

      if (res.httpStatus === 409 && isBookingActionConflictError(res.error?.message)) {
        await invalidateBookingCachesAfterAction(queryClient, bookingId);
        return;
      }

      if (res.httpStatus === 429 && res.retryAfterSec) {
        setCooldownUntil(Date.now() + res.retryAfterSec * 1000);
      }
      if (!suppressUiFeedback) {
        fireErrorHaptic();
        toast.error(res.error?.message ?? FALLBACK_ERROR);
      }
    },
    onError: (err, { suppressUiFeedback } = {}) => {
      if (!suppressUiFeedback) {
        fireErrorHaptic();
        toast.error(err?.message ?? FALLBACK_ERROR);
      }
    },
  });

  const isCoolingDown = cooldownUntil > Date.now();

  const runAction = useCallback(
    (bookingId, action, notify, options = {}) => {
      if (!bookingId || !action || mutation.isPending || isCoolingDown) {
        return;
      }
      mutation.mutate({
        bookingId,
        action,
        notify,
        suppressUiFeedback: Boolean(options.suppressUiFeedback),
      });
    },
    [mutation, isCoolingDown],
  );

  const notifyOnTheWay = useCallback(
    async (bookingId, notify = true, options = {}) => {
      if (!bookingId || mutation.isPending || isCoolingDown || isOnTheWayDone(bookingId)) {
        return { ok: false, skipped: true };
      }
      try {
        return await mutation.mutateAsync({
          bookingId,
          action: BOOKING_ACTION.ON_THE_WAY,
          notify: notify === true,
          suppressUiFeedback: Boolean(options.suppressUiFeedback),
        });
      } catch (err) {
        return {
          ok: false,
          error: { message: err?.message ?? FALLBACK_ERROR },
        };
      }
    },
    [mutation, isCoolingDown, isOnTheWayDone],
  );

  const startJob = useCallback(
    (bookingId) => {
      if (!bookingId || mutation.isPending || isCoolingDown || isJobStartedDone(bookingId)) {
        return;
      }
      runAction(bookingId, BOOKING_ACTION.JOB_STARTED);
    },
    [isCoolingDown, isJobStartedDone, mutation.isPending, runAction],
  );

  /** Async start-job for confirm sheets that own pending/success/error UI. */
  const startJobAsync = useCallback(
    async (bookingId, options = {}) => {
      if (!bookingId || mutation.isPending || isCoolingDown || isJobStartedDone(bookingId)) {
        return { ok: false, skipped: true };
      }
      try {
        return await mutation.mutateAsync({
          bookingId,
          action: BOOKING_ACTION.JOB_STARTED,
          suppressUiFeedback: Boolean(options.suppressUiFeedback),
        });
      } catch (err) {
        return {
          ok: false,
          error: { message: err?.message ?? FALLBACK_ERROR },
        };
      }
    },
    [isCoolingDown, isJobStartedDone, mutation],
  );

  const workFinished = useCallback(
    async (bookingId, notify = true, options = {}) => {
      if (!bookingId || mutation.isPending || isCoolingDown) {
        return { ok: false, skipped: true };
      }
      try {
        return await mutation.mutateAsync({
          bookingId,
          action: BOOKING_ACTION.WORK_FINISHED,
          notify: notify === true,
          suppressUiFeedback: Boolean(options.suppressUiFeedback),
        });
      } catch (err) {
        return {
          ok: false,
          error: { message: err?.message ?? FALLBACK_ERROR },
        };
      }
    },
    [isCoolingDown, mutation],
  );

  return {
    runAction,
    notifyOnTheWay,
    startJob,
    startJobAsync,
    workFinished,
    isSending: mutation.isPending,
    disabled: mutation.isPending || isCoolingDown,
    isOnTheWayDone,
    isJobStartedDone,
    isJobCompletedDone,
    getJobStatus,
  };
}

/**
 * @deprecated Use {@link useBookingAction}.
 */
export function useOnMyWayNotify(businessId) {
  const action = useBookingAction(businessId);
  return {
    notify: action.notifyOnTheWay,
    isSending: action.isSending,
    disabled: action.disabled,
    isSent: (bookingId) => action.isOnTheWayDone(bookingId),
  };
}
