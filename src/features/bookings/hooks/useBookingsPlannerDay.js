import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { useAuth } from '../../auth';
import { fetchBusinessProfileForUser } from '../../home/api/homeDashboard';
import { homeBusinessProfileQueryKey } from '../../home/queryKeys';
import { fetchBookingsForPlannerDay } from '../api/bookings';
import { BOOKINGS_QUERY_ROOT, bookingsPlannerDayQueryKey } from '../queryKeys';

/**
 * @param {string | null | undefined} yyyyMmDd - `YYYY-MM-DD`, or null when planner is inactive
 */
export function useBookingsPlannerDay(yyyyMmDd) {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const dateKey = yyyyMmDd == null || yyyyMmDd === '' ? '' : String(yyyyMmDd);

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
  });

  const business = businessQ.data ?? null;
  const businessId = business?.id;
  const hasBusinessRow = Boolean(businessId);

  const dayQ = useQuery({
    queryKey: bookingsPlannerDayQueryKey(businessId, dateKey),
    queryFn: async () => {
      const { data, error } = await fetchBookingsForPlannerDay(businessId, dateKey);
      if (error) {
        throw new Error(error.message ?? 'Could not load day');
      }
      return data ?? [];
    },
    enabled: hasBusinessRow && Boolean(dateKey),
    staleTime: 45 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const businessError = businessQ.isError
    ? (businessQ.error?.message ?? 'Could not load business')
    : null;
  const dayError = dayQ.isError ? (dayQ.error?.message ?? 'Could not load day') : null;

  const isLoading = (Boolean(userId) && businessQ.isPending) || (hasBusinessRow && dayQ.isPending);

  const refetch = useCallback(async () => {
    await queryClient.refetchQueries({ queryKey: BOOKINGS_QUERY_ROOT });
    if (userId) {
      await queryClient.refetchQueries({ queryKey: homeBusinessProfileQueryKey(userId) });
    }
  }, [queryClient, userId]);

  return {
    business,
    businessError,
    dayError,
    bookings: dayQ.data ?? [],
    isLoading,
    isFetching: businessQ.isFetching || dayQ.isFetching,
    refetch,
  };
}
