import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useToast } from '../../../components/ui';
import { useAuth } from '../../auth';
import { postBookingAction } from '../api/postBookingAction';
import { BOOKING_ACTION, isOnTheWayActionDone, normalizeJobStatus } from '../constants/jobStatus';
import { bookingsDetailsQueryKey } from '../queryKeys';
import { homeBookingsUpcomingQueryKey } from '../../home/queryKeys';
import { invalidateBookingCachesAfterAction } from '../utils/invalidateBookingCachesAfterAction';
import { patchBookingJobStatusInDetailsCache } from '../utils/patchBookingJobStatusInDetailsCache';
import { patchBookingJobStatusInHomeCache } from '../utils/patchBookingJobStatusInHomeCache';
import { isBookingActionConflictError } from '../utils/bookingActionErrors';

const ON_THE_WAY_SUCCESS_SMS = 'Customer notified you’re on the way';
const ON_THE_WAY_SUCCESS_STATE_ONLY = 'Marked on the way';
const FALLBACK_ERROR = 'Couldn’t update the appointment. Try again.';

/** Non-blocking copy when state changed but SMS did not send. */
const SMS_SKIP_MESSAGES = {
  no_phone: 'Couldn’t text the customer — no phone on file.',
  invalid_number: 'Couldn’t text the customer — invalid phone number.',
  duplicate: 'Couldn’t text the customer — already notified.',
  not_configured: 'Couldn’t text the customer — texting isn’t set up yet.',
  error: 'Couldn’t text the customer.',
};

/**
 * @param {string | null | undefined} reason
 * @returns {string}
 */
function smsSkipMessage(reason) {
  if (reason && SMS_SKIP_MESSAGES[reason]) {
    return SMS_SKIP_MESSAGES[reason];
  }
  return SMS_SKIP_MESSAGES.error;
}

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
    (bookingId, jobStatus) => {
      if (!bookingId?.trim() || !jobStatus?.trim()) {
        return;
      }
      jobStatusSessionRef.current.set(bookingId.trim(), jobStatus.trim());
      bumpSession((n) => n + 1);
      patchBookingJobStatusInHomeCache(queryClient, businessId, bookingId, jobStatus);
      patchBookingJobStatusInDetailsCache(queryClient, bookingId, jobStatus);
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
      return status != null && status !== 'not_started';
    },
    [getJobStatus],
  );

  const mutation = useMutation({
    mutationFn: ({ bookingId, action }) => postBookingAction(token, bookingId, action),
    onSuccess: async (res, { bookingId, action }) => {
      if (res.ok) {
        patchJobStatusInCache(bookingId, res.jobStatus);
        void invalidateBookingCachesAfterAction(queryClient, bookingId);
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

        if (action === BOOKING_ACTION.ON_THE_WAY) {
          if (res.smsSent) {
            toast.sms(ON_THE_WAY_SUCCESS_SMS, { type: 'success' });
          } else {
            toast.success(ON_THE_WAY_SUCCESS_STATE_ONLY);
            toast.sms(smsSkipMessage(res.smsReason), { type: 'info' });
          }
        }
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
    (bookingId, action) => {
      if (!bookingId || !action || mutation.isPending || isCoolingDown) {
        return;
      }
      mutation.mutate({ bookingId, action });
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

  return {
    runAction,
    notifyOnTheWay,
    isSending: mutation.isPending,
    disabled: mutation.isPending || isCoolingDown,
    isOnTheWayDone,
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
