import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { fetchBookingDetailsById } from '../api/bookingDetails';
import { mergeBookingDetailsCheckoutFields } from '../utils/mergeBookingDetailsCheckoutFields';
import { bookingsDetailsQueryKey } from '../../queryKeys';
import { shouldRetryBookingsQuery } from '../../utils/queryRetryPolicy';

export function useBookingDetails(bookingId) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: bookingsDetailsQueryKey(bookingId),
    queryFn: async () => {
      const previous = queryClient.getQueryData(bookingsDetailsQueryKey(bookingId));
      const { data, error } = await fetchBookingDetailsById(bookingId);
      if (error) {
        throw new Error(error.message ?? 'Could not load booking details');
      }
      if (!data) {
        throw new Error('Booking not found');
      }
      return mergeBookingDetailsCheckoutFields(data, previous);
    },
    enabled: Boolean(bookingId),
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: shouldRetryBookingsQuery,
    retryDelay: 400,
  });

  const errorMessage = useMemo(
    () => (query.isError ? (query.error?.message ?? 'Could not load booking details') : null),
    [query.error?.message, query.isError],
  );

  return {
    booking: query.data ?? null,
    isLoading: query.isPending,
    isFetching: query.isFetching,
    errorMessage,
    refetch: query.refetch,
  };
}
