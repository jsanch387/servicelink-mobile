import { homeBookingsUpcomingQueryKey } from '../../home/queryKeys';

/**
 * Optimistically updates the home spotlight booking `job_status`.
 *
 * @param {import('@tanstack/react-query').QueryClient} queryClient
 * @param {string | null | undefined} businessId
 * @param {string} bookingId
 * @param {string} jobStatus
 */
export function patchBookingJobStatusInHomeCache(queryClient, businessId, bookingId, jobStatus) {
  if (!businessId?.trim() || !bookingId?.trim() || !jobStatus?.trim()) {
    return;
  }
  queryClient.setQueryData(homeBookingsUpcomingQueryKey(businessId), (old) => {
    if (!old?.next || old.next.id !== bookingId) {
      return old;
    }
    return {
      ...old,
      next: { ...old.next, job_status: jobStatus },
    };
  });
}
