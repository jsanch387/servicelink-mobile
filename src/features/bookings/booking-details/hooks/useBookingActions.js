import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../auth';
import {
  isAppointmentRequestExpiredError,
  patchApproveAvailabilityBooking,
} from '../../api/patchApproveAvailabilityBooking';
import { patchCancelAvailabilityBooking } from '../../api/patchCancelAvailabilityBooking';
import { patchDenyAvailabilityBooking } from '../../api/patchDenyAvailabilityBooking';
import {
  applyRescheduleDisplayToBookingRow,
  patchRescheduleAvailabilityBooking,
} from '../../api/patchRescheduleAvailabilityBooking';
import { deleteBookingById } from '../api/bookingDetails';
import { bookingsDetailsQueryKey } from '../../queryKeys';
import { invalidateBookingCachesAfterMutation } from '../utils/invalidateBookingCachesAfterMutation';

export function useBookingActions(bookingId) {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const accessToken = session?.access_token ?? null;

  const markRequestExpired = async (error) => {
    if (!isAppointmentRequestExpiredError(error)) return;
    const id = String(bookingId ?? '').trim();
    if (id) {
      queryClient.setQueryData(bookingsDetailsQueryKey(id), (prev) => {
        if (!prev || typeof prev !== 'object') return prev;
        return { ...prev, status: 'expired' };
      });
    }
    await invalidateBookingCachesAfterMutation(queryClient, id || bookingId);
  };

  const approveBookingMutation = useMutation({
    mutationFn: async () => {
      const result = await patchApproveAvailabilityBooking(accessToken, bookingId);
      if (!result.ok) {
        throw result.error;
      }
      return result.booking;
    },
    onSuccess: async (booking) => {
      const id = String(booking?.id ?? bookingId ?? '').trim();
      if (id) {
        queryClient.setQueryData(bookingsDetailsQueryKey(id), (prev) => {
          if (!prev || typeof prev !== 'object') return prev;
          return { ...prev, status: booking.status || 'confirmed' };
        });
      }
      await invalidateBookingCachesAfterMutation(queryClient, id || bookingId);
    },
    onError: async (error) => {
      await markRequestExpired(error);
    },
  });

  const denyBookingMutation = useMutation({
    mutationFn: async () => {
      const result = await patchDenyAvailabilityBooking(accessToken, bookingId);
      if (!result.ok) {
        throw result.error;
      }
      return result.booking;
    },
    onSuccess: async (booking) => {
      const id = String(booking?.id ?? bookingId ?? '').trim();
      if (id) {
        queryClient.setQueryData(bookingsDetailsQueryKey(id), (prev) => {
          if (!prev || typeof prev !== 'object') return prev;
          return { ...prev, status: booking.status || 'cancelled' };
        });
      }
      await invalidateBookingCachesAfterMutation(queryClient, id || bookingId);
    },
    onError: async (error) => {
      await markRequestExpired(error);
    },
  });

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
      const result = await patchRescheduleAvailabilityBooking(accessToken, bookingId, {
        scheduledDate,
        startTime,
      });
      if (!result.ok) {
        throw result.error;
      }
      return result.booking;
    },
    onSuccess: async (booking) => {
      const id = String(booking?.id ?? bookingId ?? '').trim();
      if (id) {
        queryClient.setQueryData(bookingsDetailsQueryKey(id), (prev) =>
          applyRescheduleDisplayToBookingRow(prev, booking),
        );
      }
      await invalidateBookingCachesAfterMutation(queryClient, id || bookingId);
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
    approveBooking: approveBookingMutation.mutateAsync,
    isApprovingBooking: approveBookingMutation.isPending,
    approveBookingError: approveBookingMutation.error?.message ?? null,
    denyBooking: denyBookingMutation.mutateAsync,
    isDenyingBooking: denyBookingMutation.isPending,
    denyBookingError: denyBookingMutation.error?.message ?? null,
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
