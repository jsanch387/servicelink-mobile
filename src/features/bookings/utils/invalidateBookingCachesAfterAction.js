import { HOME_QUERY_KEY } from '../../home/queryKeys';
import { BOOKINGS_QUERY_ROOT, bookingsDetailsQueryKey } from '../queryKeys';

/**
 * After a booking action, refresh list/calendar + home so `job_status` stays in sync.
 * Details are patched optimistically; include home in case spotlight booking changed.
 *
 * @param {import('@tanstack/react-query').QueryClient} queryClient
 * @param {string | null | undefined} [bookingId]
 */
export function invalidateBookingCachesAfterAction(queryClient, bookingId) {
  const tasks = [
    queryClient.invalidateQueries({ queryKey: BOOKINGS_QUERY_ROOT }),
    queryClient.invalidateQueries({ queryKey: HOME_QUERY_KEY }),
  ];
  if (bookingId?.trim()) {
    tasks.push(
      queryClient.invalidateQueries({ queryKey: bookingsDetailsQueryKey(bookingId.trim()) }),
    );
  }
  return Promise.all(tasks);
}
