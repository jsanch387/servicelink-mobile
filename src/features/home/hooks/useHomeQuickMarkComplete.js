import { useMutation, useQueryClient } from '@tanstack/react-query';
import { markBookingCompletedById } from '../../bookings/booking-details/api/bookingDetails';
import { invalidateBookingCachesAfterMutation } from '../../bookings/booking-details/utils/invalidateBookingCachesAfterMutation';

/**
 * Same Supabase update as booking details “Mark completed”, with identical cache invalidation
 * ({@link invalidateBookingCachesAfterMutation}).
 */
export function useHomeQuickMarkComplete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingId) => {
      const { error } = await markBookingCompletedById(bookingId);
      if (error) {
        throw new Error(error.message ?? 'Could not mark booking as completed');
      }
    },
    onSuccess: async (_data, bookingId) => {
      if (bookingId) {
        await invalidateBookingCachesAfterMutation(queryClient, bookingId);
      }
    },
  });
}
