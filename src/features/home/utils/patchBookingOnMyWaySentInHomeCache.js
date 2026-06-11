import { homeBookingsUpcomingQueryKey } from '../queryKeys';

/**
 * Optimistically marks the home spotlight booking as on-my-way sent (instant UI).
 *
 * @param {import('@tanstack/react-query').QueryClient} queryClient
 * @param {string | null | undefined} businessId
 * @param {string} bookingId
 * @param {string} [sentAt] ISO timestamp; defaults to now.
 */
export function patchBookingOnMyWaySentInHomeCache(
  queryClient,
  businessId,
  bookingId,
  sentAt = new Date().toISOString(),
) {
  if (!businessId?.trim() || !bookingId?.trim()) {
    return;
  }
  queryClient.setQueryData(homeBookingsUpcomingQueryKey(businessId), (old) => {
    if (!old?.next || old.next.id !== bookingId) {
      return old;
    }
    return {
      ...old,
      next: { ...old.next, on_my_way_sent_at: sentAt },
    };
  });
}
