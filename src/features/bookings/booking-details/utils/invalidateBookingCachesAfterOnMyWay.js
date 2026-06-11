import { BOOKINGS_QUERY_ROOT } from '../../queryKeys';

/**
 * After on-my-way SMS, refresh list/calendar bookings only.
 * Skips home + booking-details queries — those are patched optimistically so a
 * refetch cannot wipe `on_my_way_sent_at` before the server persists the column.
 *
 * @param {import('@tanstack/react-query').QueryClient} queryClient
 */
export function invalidateBookingCachesAfterOnMyWay(queryClient) {
  return queryClient.invalidateQueries({ queryKey: BOOKINGS_QUERY_ROOT });
}
