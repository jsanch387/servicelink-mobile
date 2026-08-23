import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { bookingsActivityQueryKey } from '../../queryKeys';
import { shouldRetryBookingsQuery } from '../../utils/queryRetryPolicy';
import { fetchBookingActivity } from '../api/fetchBookingActivity';
import { buildBookingActivityModel } from '../utils/buildBookingActivityModel';

export function useBookingActivity(bookingId) {
  const query = useQuery({
    queryKey: bookingsActivityQueryKey(bookingId),
    queryFn: async () => {
      const { data, error } = await fetchBookingActivity(bookingId);
      if (error) {
        throw error;
      }
      return data;
    },
    enabled: Boolean(bookingId),
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: shouldRetryBookingsQuery,
    retryDelay: 400,
  });

  const groups = useMemo(
    () => (query.data ? buildBookingActivityModel(query.data) : []),
    [query.data],
  );

  const errorMessage = useMemo(
    () => (query.isError ? (query.error?.message ?? 'Could not load activity') : null),
    [query.error?.message, query.isError],
  );

  return {
    groups,
    isLoading: query.isPending,
    isFetching: query.isFetching,
    errorMessage,
    refetch: query.refetch,
  };
}
