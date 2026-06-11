import { bookingsDetailsQueryKey } from '../queryKeys';

/**
 * Optimistically updates booking details `job_status`.
 *
 * @param {import('@tanstack/react-query').QueryClient} queryClient
 * @param {string} bookingId
 * @param {string} jobStatus
 */
export function patchBookingJobStatusInDetailsCache(queryClient, bookingId, jobStatus) {
  if (!bookingId?.trim() || !jobStatus?.trim()) {
    return;
  }
  queryClient.setQueryData(bookingsDetailsQueryKey(bookingId), (old) => {
    if (!old || typeof old !== 'object') {
      return old;
    }
    return { ...old, job_status: jobStatus };
  });
}
