import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo } from 'react';
import { useAuth } from '../../auth';
import { fetchBusinessProfileForUser } from '../../home/api/homeDashboard';
import { homeBusinessProfileQueryKey } from '../../home/queryKeys';
import { fetchBookingsCountsForCalendarRange } from '../api/bookings';
import { BOOKINGS_QUERY_ROOT, bookingsCalendarCountsQueryKey } from '../queryKeys';
import { bookingCountsFromScheduledRows } from '../utils/calendarBookingsIndex';
import { shouldRetryBookingsQuery } from '../utils/queryRetryPolicy';

/**
 * Lightweight per-day counts for month/week calendar markers (not full booking rows).
 */
export function useBookingsCalendarCounts({ rangeStart, rangeEnd, enabled = true }) {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const startKey = rangeStart == null || rangeStart === '' ? '' : String(rangeStart);
  const endKey = rangeEnd == null || rangeEnd === '' ? '' : String(rangeEnd);
  const rangeReady = Boolean(startKey && endKey);

  useFocusEffect(
    useCallback(() => {
      void queryClient.refetchQueries({
        queryKey: BOOKINGS_QUERY_ROOT,
        type: 'active',
        stale: true,
      });
    }, [queryClient]),
  );

  const businessQ = useQuery({
    queryKey: homeBusinessProfileQueryKey(userId),
    queryFn: async () => {
      const { data, error } = await fetchBusinessProfileForUser(userId);
      if (error) {
        throw new Error(error.message ?? 'Could not load business');
      }
      return data;
    },
    enabled: Boolean(userId),
    staleTime: 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: shouldRetryBookingsQuery,
    retryDelay: 400,
  });

  const business = businessQ.data ?? null;
  const businessId = business?.id;
  const hasBusinessRow = Boolean(businessId);

  const countsQ = useQuery({
    queryKey: bookingsCalendarCountsQueryKey(businessId, startKey, endKey),
    queryFn: async () => {
      const { data, error } = await fetchBookingsCountsForCalendarRange(
        businessId,
        startKey,
        endKey,
      );
      if (error) {
        throw new Error(error.message ?? 'Could not load calendar');
      }
      return data ?? [];
    },
    enabled: enabled && hasBusinessRow && rangeReady,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: shouldRetryBookingsQuery,
    retryDelay: 400,
  });

  const bookingCountByDateKey = useMemo(
    () => bookingCountsFromScheduledRows(countsQ.data),
    [countsQ.data],
  );

  const businessError = businessQ.isError
    ? (businessQ.error?.message ?? 'Could not load business')
    : null;
  const countsError = countsQ.isError
    ? (countsQ.error?.message ?? 'Could not load calendar')
    : null;

  const isLoading =
    (Boolean(userId) && businessQ.isPending) || (hasBusinessRow && rangeReady && countsQ.isPending);

  const refetch = useCallback(async () => {
    await queryClient.refetchQueries({ queryKey: BOOKINGS_QUERY_ROOT });
    if (userId) {
      await queryClient.refetchQueries({ queryKey: homeBusinessProfileQueryKey(userId) });
    }
  }, [queryClient, userId]);

  return {
    business,
    businessError,
    countsError,
    bookingCountByDateKey,
    isLoading,
    isFetching: businessQ.isFetching || countsQ.isFetching,
    refetch,
  };
}
