import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useToast } from '../../../components/ui';
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
 * Owner-triggered booking actions (`on_the_way`, `job_started`, `job_completed`).
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
    onSuccess: async (res, { bookingId, action, notify }) => {
      if (res.ok) {
        patchJobStatusInCache(bookingId, res.jobStatus, res.bookingStatus, res.workHandoffStatus);
        void invalidateBookingCachesAfterAction(queryClient, bookingId);
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        if (action === BOOKING_ACTION.WORK_FINISHED && notify !== true) {
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
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      toast.error(res.error?.message ?? FALLBACK_ERROR);
    },
    onError: (err) => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      toast.error(err?.message ?? FALLBACK_ERROR);
    },
  });

  const isCoolingDown = cooldownUntil > Date.now();

  const runAction = useCallback(
    (bookingId, action, notify) => {
      if (!bookingId || !action || mutation.isPending || isCoolingDown) {
        return;
      }
      mutation.mutate({ bookingId, action, notify });
    },
    [mutation, isCoolingDown],
  );

  const notifyOnTheWay = useCallback(
    (bookingId) => {
      if (!bookingId || mutation.isPending || isCoolingDown || isOnTheWayDone(bookingId)) {
        return;
      }
      runAction(bookingId, BOOKING_ACTION.ON_THE_WAY);
    },
    [mutation.isPending, isCoolingDown, isOnTheWayDone, runAction],
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

  const completeJob = useCallback(
    (bookingId) => {
      if (!bookingId || mutation.isPending || isCoolingDown || isJobCompletedDone(bookingId)) {
        return;
      }
      runAction(bookingId, BOOKING_ACTION.JOB_COMPLETED);
    },
    [isCoolingDown, isJobCompletedDone, mutation.isPending, runAction],
  );

  const workFinished = useCallback(
    (bookingId, notify) => {
      if (!bookingId || mutation.isPending || isCoolingDown) {
        return;
      }
      runAction(bookingId, BOOKING_ACTION.WORK_FINISHED, notify === true);
    },
    [isCoolingDown, mutation.isPending, runAction],
  );

  return {
    runAction,
    notifyOnTheWay,
    startJob,
    completeJob,
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
