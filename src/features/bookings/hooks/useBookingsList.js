import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { useAuth } from '../../auth';
import { fetchBusinessProfileForUser } from '../../home/api/homeDashboard';
import { homeBusinessProfileQueryKey } from '../../home/queryKeys';
import {
  fetchCancelledBookingsForBusiness,
  fetchConfirmedBookingsFromToday,
  fetchPastConfirmedBookingsForBusiness,
  filterPastConfirmedRows,
  partitionUpcomingConfirmed,
  sortCancelledBookingsForList,
} from '../api/bookings';
import {
  BOOKINGS_FILTER_CANCELLED,
  BOOKINGS_FILTER_PAST,
  BOOKINGS_FILTER_UPCOMING,
} from '../constants';
import { BOOKINGS_QUERY_ROOT, bookingsListQueryKey } from '../queryKeys';
import { shouldRetryBookingsQuery } from '../utils/queryRetryPolicy';

/**
 * @param {{ listEnabled?: boolean }} [options] - set false while day planner is visible to skip list queries
 */
export function useBookingsList(options = {}) {
  const { listEnabled = true } = options;
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const [listFilter, setListFilter] = useState(BOOKINGS_FILTER_UPCOMING);

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

  const listQ = useQuery({
    queryKey: bookingsListQueryKey(businessId, listFilter),
    queryFn: async () => {
      const nowMs = Date.now();
      if (listFilter === BOOKINGS_FILTER_UPCOMING) {
        const { data: rows, error } = await fetchConfirmedBookingsFromToday(businessId);
        if (error) {
          throw new Error(error.message ?? 'Could not load bookings');
        }
        return partitionUpcomingConfirmed(rows ?? [], nowMs).upcoming;
      }
      if (listFilter === BOOKINGS_FILTER_PAST) {
        const { data: rows, error } = await fetchPastConfirmedBookingsForBusiness(businessId);
        if (error) {
          throw new Error(error.message ?? 'Could not load bookings');
        }
        return filterPastConfirmedRows(rows, nowMs);
      }
      if (listFilter === BOOKINGS_FILTER_CANCELLED) {
        const { data: rows, error } = await fetchCancelledBookingsForBusiness(businessId);
        if (error) {
          throw new Error(error.message ?? 'Could not load bookings');
        }
        return sortCancelledBookingsForList(rows);
      }
      return [];
    },
    enabled: hasBusinessRow && listEnabled,
    staleTime: 45 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: shouldRetryBookingsQuery,
    retryDelay: 400,
  });

  const businessError = businessQ.isError
    ? (businessQ.error?.message ?? 'Could not load business')
    : null;
  const listError = listQ.isError ? (listQ.error?.message ?? 'Could not load bookings') : null;

  const isPendingBusiness = Boolean(userId) && businessQ.isPending;
  const isPendingList = hasBusinessRow && listEnabled && listQ.isPending;
  const isLoading = isPendingBusiness || isPendingList;
  const isFetching = businessQ.isFetching || (listEnabled && listQ.isFetching);

  const refetch = useCallback(async () => {
    await queryClient.refetchQueries({ queryKey: BOOKINGS_QUERY_ROOT });
    if (userId) {
      await queryClient.refetchQueries({ queryKey: homeBusinessProfileQueryKey(userId) });
    }
  }, [queryClient, userId]);

  return {
    business,
    businessError,
    listError,
    bookings: listQ.data ?? [],
    listFilter,
    setListFilter,
    isPendingBusiness,
    isPendingList,
    isLoading,
    isFetching,
    refetch,
  };
}
