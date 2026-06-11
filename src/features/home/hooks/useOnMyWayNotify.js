import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useToast } from '../../../components/ui';
import { invalidateBookingCachesAfterOnMyWay } from '../../bookings/booking-details/utils/invalidateBookingCachesAfterOnMyWay';
import { patchBookingOnMyWaySentInDetailsCache } from '../../bookings/booking-details/utils/patchBookingOnMyWaySentInDetailsCache';
import { bookingsDetailsQueryKey } from '../../bookings/queryKeys';
import { useAuth } from '../../auth';
import { postOnMyWayForBooking } from '../api/postOnMyWayForBooking';
import { homeBookingsUpcomingQueryKey } from '../queryKeys';
import { isOnMyWayAlreadySentError, isOnMyWaySent } from '../utils/bookingOnMyWay';
import { patchBookingOnMyWaySentInHomeCache } from '../utils/patchBookingOnMyWaySentInHomeCache';

const SUCCESS_MESSAGE = 'Customer notified you’re on the way';
const FALLBACK_ERROR = 'Couldn’t send the text. Try again.';

/**
 * @param {import('@tanstack/react-query').QueryClient} queryClient
 * @param {string | null | undefined} businessId
 * @param {string} bookingId
 * @returns {boolean}
 */
function readOnMyWaySentFromCaches(queryClient, businessId, bookingId) {
  const details = queryClient.getQueryData(bookingsDetailsQueryKey(bookingId));
  if (isOnMyWaySent(details)) {
    return true;
  }
  if (businessId) {
    const home = queryClient.getQueryData(homeBookingsUpcomingQueryKey(businessId));
    if (home?.next?.id === bookingId && isOnMyWaySent(home.next)) {
      return true;
    }
  }
  return false;
}

/**
 * Owner taps "On my way" → server texts the customer via Pingram.
 *
 * The server sets `bookings.on_my_way_sent_at` after a successful send (mobile does
 * not send that field). We patch caches + track session sends so the button stays
 * locked even if a refetch arrives before the DB column is visible.
 *
 * @param {string | null | undefined} businessId Used for home cache reads/writes.
 * @returns {{
 *   notify: (bookingId: string) => void;
 *   isSending: boolean;
 *   disabled: boolean;
 *   isSent: (bookingId: string | null | undefined) => boolean;
 * }}
 */
export function useOnMyWayNotify(businessId) {
  const { session } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const token = session?.access_token ?? null;
  const [cooldownUntil, setCooldownUntil] = useState(0);
  /** Booking ids successfully sent this app session (survives cache invalidation). */
  const sentSessionRef = useRef(new Set());
  const [, bumpSentSession] = useState(0);

  useEffect(() => {
    if (cooldownUntil <= Date.now()) {
      return undefined;
    }
    const timer = setTimeout(() => setCooldownUntil(0), cooldownUntil - Date.now());
    return () => clearTimeout(timer);
  }, [cooldownUntil]);

  const markSentInCache = useCallback(
    (bookingId, sentAt = new Date().toISOString()) => {
      sentSessionRef.current.add(bookingId);
      bumpSentSession((n) => n + 1);
      patchBookingOnMyWaySentInHomeCache(queryClient, businessId, bookingId, sentAt);
      patchBookingOnMyWaySentInDetailsCache(queryClient, bookingId, sentAt);
    },
    [businessId, queryClient],
  );

  const isSent = useCallback(
    (bookingId) => {
      if (!bookingId?.trim()) {
        return false;
      }
      const id = bookingId.trim();
      if (sentSessionRef.current.has(id)) {
        return true;
      }
      return readOnMyWaySentFromCaches(queryClient, businessId, id);
    },
    [businessId, queryClient],
  );

  const mutation = useMutation({
    mutationFn: (bookingId) => postOnMyWayForBooking(token, bookingId),
    onSuccess: (res, bookingId) => {
      if (res.ok) {
        const sentAt =
          typeof res.onMyWaySentAt === 'string' && res.onMyWaySentAt.trim()
            ? res.onMyWaySentAt.trim()
            : new Date().toISOString();
        markSentInCache(bookingId, sentAt);
        void invalidateBookingCachesAfterOnMyWay(queryClient);
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        toast.success(SUCCESS_MESSAGE);
        return;
      }

      if (res.httpStatus === 409 && isOnMyWayAlreadySentError(res.error?.message)) {
        markSentInCache(bookingId);
        void invalidateBookingCachesAfterOnMyWay(queryClient);
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

  const notify = useCallback(
    (bookingId) => {
      if (!bookingId || mutation.isPending || isCoolingDown || isSent(bookingId)) {
        return;
      }
      mutation.mutate(bookingId);
    },
    [mutation, isCoolingDown, isSent],
  );

  return {
    notify,
    isSending: mutation.isPending,
    disabled: mutation.isPending || isCoolingDown,
    isSent,
  };
}
