import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../auth';
import { invalidateBookingCachesAfterMutation } from '../../booking-details/utils/invalidateBookingCachesAfterMutation';
import { patchBookingAssignee } from '../api/patchBookingAssignee';
import { patchAssignedUserIdInDetailsCache } from '../utils/patchAssignedUserIdInDetailsCache';

/**
 * @param {string | null | undefined} bookingId
 */
export function usePatchBookingAssignee(bookingId) {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const accessToken = session?.access_token ?? null;
  const id = String(bookingId ?? '').trim();

  const mutation = useMutation({
    mutationFn: async (assignedUserId) => {
      const result = await patchBookingAssignee(accessToken, id, assignedUserId);
      if (!result.ok) {
        throw result.error;
      }
      return result;
    },
    onSuccess: async (result) => {
      patchAssignedUserIdInDetailsCache(queryClient, result.bookingId, result.assignedUserId);
      await invalidateBookingCachesAfterMutation(queryClient, result.bookingId);
    },
  });

  return {
    assignBooking: mutation.mutateAsync,
    isAssigning: mutation.isPending,
    assignError: mutation.error?.message ?? null,
    resetAssignError: mutation.reset,
  };
}
