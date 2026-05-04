import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { useAuth } from '../../auth';
import {
  fetchBusinessProfileForUser,
  fetchConfirmedBookingsFromToday,
  pickHomeSpotlight,
} from '../api/homeDashboard';
import {
  HOME_QUERY_KEY,
  homeBookingsUpcomingQueryKey,
  homeBookingsTodayQueryKey,
  homeBusinessProfileQueryKey,
} from '../queryKeys';
import {
  formatInProgressSubtitle,
  formatNextUpWhenLine,
  parseBookingStartLocalMs,
} from '../utils/bookingStart';
import { fetchConfirmedBookingsForToday } from '../api/restOfToday';
import { mapBookingsToRestOfTodayItems } from '../utils/restOfToday';

export function useHomeDashboard() {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();

  useFocusEffect(
    useCallback(() => {
      void queryClient.refetchQueries({
        queryKey: HOME_QUERY_KEY,
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

  const bookingsQ = useQuery({
    queryKey: homeBookingsUpcomingQueryKey(businessId),
    queryFn: async () => {
      const { data: rows, error } = await fetchConfirmedBookingsFromToday(businessId);
      if (error) {
        throw new Error(error.message ?? 'Could not load bookings');
      }
      const nowMs = Date.now();
      const pick = pickHomeSpotlight(rows ?? [], nowMs);
      let nextSubtitle = '';
      if (pick.spotlight) {
        const startMs = parseBookingStartLocalMs(
          pick.spotlight.scheduled_date,
          pick.spotlight.start_time,
        );
        nextSubtitle =
          pick.spotlightMode === 'in_progress'
            ? formatInProgressSubtitle(startMs)
            : formatNextUpWhenLine(startMs, nowMs);
      }
      return {
        next: pick.spotlight,
        upcomingCount: pick.upcomingCount,
        nextSubtitle,
        spotlightMode: pick.spotlightMode,
      };
    },
    enabled: hasBusinessRow,
    staleTime: 45 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const todayBookingsQ = useQuery({
    queryKey: homeBookingsTodayQueryKey(businessId),
    queryFn: async () => {
      const { data: rows, error } = await fetchConfirmedBookingsForToday(businessId);
      if (error) {
        throw new Error(error.message ?? 'Could not load today bookings');
      }
      return mapBookingsToRestOfTodayItems(rows);
    },
    enabled: hasBusinessRow,
    staleTime: 45 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const businessError = businessQ.isError
    ? (businessQ.error?.message ?? 'Could not load business')
    : null;
  const bookingsError = bookingsQ.isError
    ? (bookingsQ.error?.message ?? 'Could not load bookings')
    : null;
  const todayBookingsError = todayBookingsQ.isError
    ? (todayBookingsQ.error?.message ?? 'Could not load today bookings')
    : null;

  const nextBooking = bookingsQ.data?.next ?? null;
  const upcomingCount = bookingsQ.data?.upcomingCount ?? 0;
  const nextSubtitle = bookingsQ.data?.nextSubtitle ?? '';
  const spotlightMode = bookingsQ.data?.spotlightMode ?? 'none';
  const todayTimelineItems = todayBookingsQ.data ?? [];

  const isPendingBusiness = Boolean(userId) && businessQ.isPending;
  const isPendingBookings = hasBusinessRow && bookingsQ.isPending;
  const isPendingTodayBookings = hasBusinessRow && todayBookingsQ.isPending;
  const isLoading = isPendingBusiness || isPendingBookings;
  const isFetching = businessQ.isFetching || bookingsQ.isFetching || todayBookingsQ.isFetching;

  const refetch = useCallback(() => {
    return queryClient.refetchQueries({ queryKey: HOME_QUERY_KEY });
  }, [queryClient]);

  return {
    business,
    businessError,
    bookingsError,
    todayBookingsError,
    nextBooking,
    upcomingCount,
    nextSubtitle,
    spotlightMode,
    todayTimelineItems,
    isPendingBusiness,
    isPendingBookings,
    isPendingTodayBookings,
    isLoading,
    isFetching,
    refetch,
  };
}
