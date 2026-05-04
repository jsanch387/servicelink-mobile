import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cancelBookingById, markBookingCompletedById } from '../api/bookingDetails';
import { invalidateBookingCachesAfterMutation } from '../utils/invalidateBookingCachesAfterMutation';

export function useBookingActions(bookingId) {
  const queryClient = useQueryClient();

  const markCompletedMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await markBookingCompletedById(bookingId);
      if (error) {
        throw new Error(error.message ?? 'Could not mark booking as completed');
      }
      return data;
    },
    onSuccess: async () => {
      await invalidateBookingCachesAfterMutation(queryClient, bookingId);
    },
  });

  const cancelBookingMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await cancelBookingById(bookingId);
      if (error) {
        throw new Error(error.message ?? 'Could not cancel booking');
      }
      return data;
    },
    onSuccess: async () => {
      await invalidateBookingCachesAfterMutation(queryClient, bookingId);
    },
  });

  return {
    markCompleted: markCompletedMutation.mutateAsync,
    isMarkingCompleted: markCompletedMutation.isPending,
    markCompletedError: markCompletedMutation.error?.message ?? null,
    cancelBooking: cancelBookingMutation.mutateAsync,
    isCancellingBooking: cancelBookingMutation.isPending,
    cancelBookingError: cancelBookingMutation.error?.message ?? null,
  };
}
