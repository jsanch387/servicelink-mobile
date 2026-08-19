import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../auth';
import { patchCancelAvailabilityBooking } from '../../api/patchCancelAvailabilityBooking';
import { deleteBookingById, rescheduleBookingById } from '../api/bookingDetails';
import { bookingsDetailsQueryKey } from '../../queryKeys';
import { invalidateBookingCachesAfterMutation } from '../utils/invalidateBookingCachesAfterMutation';

export function useBookingActions(bookingId) {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const accessToken = session?.access_token ?? null;

  const cancelBookingMutation = useMutation({
    mutationFn: async () => {
      const result = await patchCancelAvailabilityBooking(accessToken, bookingId);
      if (!result.ok) {
        throw result.error;
      }
      return result.booking;
    },
    onSuccess: async (booking) => {
      const id = String(booking?.id ?? bookingId ?? '').trim();
      if (id && booking?.status) {
        queryClient.setQueryData(bookingsDetailsQueryKey(id), (prev) => {
          if (!prev || typeof prev !== 'object') return prev;
          return { ...prev, status: booking.status };
        });
      }
      await invalidateBookingCachesAfterMutation(queryClient, id || bookingId);
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
