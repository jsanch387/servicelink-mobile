import { applyCheckoutSnapshotToBooking } from '../booking-details/utils/applyCheckoutSnapshotToBooking';
import { bookingsDetailsQueryKey } from '../queryKeys';

/**
 * Optimistically merges Complete visit checkout (fees + session payment) into booking details cache
 * so returning to booking details reflects the just-collected total before refetch completes.
 *
 * @param {import('@tanstack/react-query').QueryClient} queryClient
 * @param {string} bookingId
 * @param {import('../booking-details/utils/buildJobCompletedPayload').CompleteVisitCheckoutState | null | undefined} checkout
 */
export function patchBookingCheckoutInDetailsCache(queryClient, bookingId, checkout) {
  if (!bookingId?.trim() || !checkout) {
    return;
  }

  queryClient.setQueryData(bookingsDetailsQueryKey(bookingId), (old) => {
    if (!old || typeof old !== 'object') {
      return old;
    }
    return applyCheckoutSnapshotToBooking(old, checkout) ?? old;
  });
}
