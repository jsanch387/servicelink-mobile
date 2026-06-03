import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cancelBookingById, deleteBookingById, rescheduleBookingById } from '../api/bookingDetails';
import { bookingsDetailsQueryKey } from '../../queryKeys';
import { invalidateBookingCachesAfterMutation } from '../utils/invalidateBookingCachesAfterMutation';

export function useBookingActions(bookingId) {
  const queryClient = useQueryClient();

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

  const rescheduleBookingMutation = useMutation({
    mutationFn: async ({ scheduledDate, startTime }) => {
      const { data, error } = await rescheduleBookingById(bookingId, {
        scheduledDate,
        startTime,
      });
      if (error) {
        throw new Error(error.message ?? 'Could not reschedule booking');
      }
      return data;
    },
    onSuccess: async () => {
      await invalidateBookingCachesAfterMutation(queryClient, bookingId);
    },
  });

  const deleteBookingMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await deleteBookingById(bookingId);
      if (error) {
        throw new Error(error.message ?? 'Could not delete booking');
      }
      return data;
    },
    onSuccess: async () => {
      await invalidateBookingCachesAfterMutation(queryClient, bookingId);
      queryClient.removeQueries({ queryKey: bookingsDetailsQueryKey(bookingId) });
    },
  });

  return {
    cancelBooking: cancelBookingMutation.mutateAsync,
    isCancellingBooking: cancelBookingMutation.isPending,
    cancelBookingError: cancelBookingMutation.error?.message ?? null,
    rescheduleBooking: rescheduleBookingMutation.mutateAsync,
    isReschedulingBooking: rescheduleBookingMutation.isPending,
    rescheduleBookingError: rescheduleBookingMutation.error?.message ?? null,
    deleteBooking: deleteBookingMutation.mutateAsync,
    isDeletingBooking: deleteBookingMutation.isPending,
    deleteBookingError: deleteBookingMutation.error?.message ?? null,
  };
}
