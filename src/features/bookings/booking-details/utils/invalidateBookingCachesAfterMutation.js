import { HOME_QUERY_KEY } from '../../../home/queryKeys';
import { MAINTENANCE_QUERY_ROOT } from '../../../maintenance/queryKeys';
import { MEMBERSHIPS_QUERY_ROOT } from '../../../subscriptions/queryKeys';
import { BOOKINGS_QUERY_ROOT, bookingsDetailsQueryKey } from '../../queryKeys';

/**
 * After a booking row changes (complete / cancel / etc.), refresh details, all bookings queries,
 * home, maintenance, and memberships (period-visit status may change).
 *
 * @param {import('@tanstack/react-query').QueryClient} queryClient
 * @param {string} bookingId
 */
export function invalidateBookingCachesAfterMutation(queryClient, bookingId) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: bookingsDetailsQueryKey(bookingId) }),
    queryClient.invalidateQueries({ queryKey: BOOKINGS_QUERY_ROOT }),
    queryClient.invalidateQueries({ queryKey: HOME_QUERY_KEY }),
    queryClient.invalidateQueries({ queryKey: MAINTENANCE_QUERY_ROOT }),
    queryClient.invalidateQueries({ queryKey: MEMBERSHIPS_QUERY_ROOT }),
  ]);
}
