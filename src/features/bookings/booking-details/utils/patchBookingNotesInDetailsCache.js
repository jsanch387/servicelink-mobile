import { bookingsDetailsQueryKey } from '../../queryKeys';

/**
 * Updates booking details cache after notes are saved.
 *
 * @param {import('@tanstack/react-query').QueryClient} queryClient
 * @param {string} bookingId
 * @param {string} notes
 */
export function patchBookingNotesInDetailsCache(queryClient, bookingId, notes) {
  const id = String(bookingId ?? '').trim();
  if (!id) {
    return;
  }
  queryClient.setQueryData(bookingsDetailsQueryKey(id), (old) => {
    if (!old || typeof old !== 'object') {
      return old;
    }
    return {
      ...old,
      customer_notes: notes,
    };
  });
}
