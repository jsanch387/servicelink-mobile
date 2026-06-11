import { bookingsDetailsQueryKey } from '../../queryKeys';

/**
 * Optimistically marks booking details as on-my-way sent (instant UI on details screen).
 *
 * @param {import('@tanstack/react-query').QueryClient} queryClient
 * @param {string} bookingId
 * @param {string} [sentAt] ISO timestamp; defaults to now.
 */
export function patchBookingOnMyWaySentInDetailsCache(
  queryClient,
  bookingId,
  sentAt = new Date().toISOString(),
) {
  if (!bookingId?.trim()) {
    return;
  }
  queryClient.setQueryData(bookingsDetailsQueryKey(bookingId), (old) => {
    if (!old || typeof old !== 'object') {
      return old;
    }
    return { ...old, on_my_way_sent_at: sentAt };
  });
}
