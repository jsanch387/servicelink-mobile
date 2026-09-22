import { bookingsDetailsQueryKey } from '../../queryKeys';

/**
 * Updates booking details cache after a successful assignee save.
 *
 * @param {import('@tanstack/react-query').QueryClient} queryClient
 * @param {string} bookingId
 * @param {string | null} assignedUserId
 */
export function patchAssignedUserIdInDetailsCache(queryClient, bookingId, assignedUserId) {
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
      assigned_user_id: assignedUserId,
      assignedUserId,
    };
  });
}
