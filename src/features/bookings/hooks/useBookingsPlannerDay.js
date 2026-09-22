import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { useAuth } from '../../auth';
import { homeBusinessProfileQueryKey } from '../../home/queryKeys';
import { shopProfileQueryOptions } from '../../shop/shopProfileQueryOptions';
import { stampBookingsWithAssigneeQuery } from '../assignee/utils/attachAssigneeDisplayToBookings';
import { fetchBookingsForPlannerDay } from '../api/bookings';
import { BOOKINGS_QUERY_ROOT, bookingsPlannerDayQueryKey } from '../queryKeys';

/**
 * @param {string | null | undefined} yyyyMmDd - `YYYY-MM-DD`, or null when planner is inactive
 */
export function useBookingsPlannerDay(yyyyMmDd) {
  const { user, session } = useAuth();
  const userId = user?.id;
  const accessToken = session?.access_token;
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

  const businessQ = useQuery(shopProfileQueryOptions(userId));

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
      return stampBookingsWithAssigneeQuery(queryClient, {
        accessToken,
        userId,
        rows: data ?? [],
      });
    },
    enabled: hasBusinessRow && Boolean(dateKey),
    staleTime: 45 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const businessError = businessQ.isError
    ? (businessQ.error?.message ?? 'Could not load business')
    : null;
  const dayError = dayQ.isError ? (dayQ.error?.message ?? 'Could not load day') : null;

  const isDayPending = hasBusinessRow && Boolean(dateKey) && dayQ.isPending;
  const isLoading =
    (Boolean(userId) && (businessQ.isPending || (businessQ.isFetching && !hasBusinessRow))) ||
    isDayPending;

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
    isDayPending,
    isFetching: businessQ.isFetching || dayQ.isFetching,
    refetch,
  };
}
