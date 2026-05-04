import { HOME_QUERY_KEY } from '../../../home/queryKeys';
import { BOOKINGS_QUERY_ROOT, bookingsDetailsQueryKey } from '../../queryKeys';

/**
 * After a booking row changes (complete / cancel / etc.), refresh details, all bookings queries, and home.
 *
 * @param {import('@tanstack/react-query').QueryClient} queryClient
 * @param {string} bookingId
 */
export function invalidateBookingCachesAfterMutation(queryClient, bookingId) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: bookingsDetailsQueryKey(bookingId) }),
    queryClient.invalidateQueries({ queryKey: BOOKINGS_QUERY_ROOT }),
    queryClient.invalidateQueries({ queryKey: HOME_QUERY_KEY }),
  ]);
}
