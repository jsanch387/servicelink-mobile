import { bookingsDetailsQueryKey } from '../queryKeys';

/**
 * Optimistically updates booking details `job_status` and optional `status`.
 *
 * @param {import('@tanstack/react-query').QueryClient} queryClient
 * @param {string} bookingId
 * @param {string} jobStatus
 * @param {string | null | undefined} [bookingStatus]
 */
export function patchBookingJobStatusInDetailsCache(
  queryClient,
  bookingId,
  jobStatus,
  bookingStatus,
) {
  if (!bookingId?.trim() || !jobStatus?.trim()) {
    return;
  }
  queryClient.setQueryData(bookingsDetailsQueryKey(bookingId), (old) => {
    if (!old || typeof old !== 'object') {
      return old;
    }
    return {
      ...old,
      job_status: jobStatus,
      ...(bookingStatus?.trim() ? { status: bookingStatus.trim() } : {}),
    };
  });
}
