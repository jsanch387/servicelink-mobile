import { useMutation, useQueryClient } from '@tanstack/react-query';
import { HOME_QUERY_KEY } from '../../../home/queryKeys';
import { BOOKINGS_QUERY_ROOT, bookingsDetailsQueryKey } from '../../queryKeys';
import { cancelBookingById, markBookingCompletedById } from '../api/bookingDetails';

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
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: bookingsDetailsQueryKey(bookingId) }),
        queryClient.invalidateQueries({ queryKey: BOOKINGS_QUERY_ROOT }),
        queryClient.invalidateQueries({ queryKey: HOME_QUERY_KEY }),
      ]);
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
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: bookingsDetailsQueryKey(bookingId) }),
        queryClient.invalidateQueries({ queryKey: BOOKINGS_QUERY_ROOT }),
        queryClient.invalidateQueries({ queryKey: HOME_QUERY_KEY }),
      ]);
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
