import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { useAuth } from '../../auth';
import { fetchBusinessProfileForUser } from '../../home/api/homeDashboard';
import { homeBusinessProfileQueryKey } from '../../home/queryKeys';
import {
  fetchBookingsForListWindow,
  fetchCancelledBookingsForBusiness,
  fetchConfirmedBookingsFromToday,
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
import {
  getInitialListMonthWindow,
  getLoadMoreLabel,
  getNextListMonthWindow,
  listMonthWindowsFromPageParam,
} from '../utils/listMonthWindows';
import { shouldRetryBookingsQuery } from '../utils/queryRetryPolicy';

/**
 * @param {{ bookings: import('../api/bookings').BookingRow[] }[]} pages
 * @param {number} nowMs
 */
function mergePastListPages(pages, nowMs) {
  const byId = new Map();
  for (const page of pages) {
    for (const row of page.bookings) {
      byId.set(row.id, row);
    }
  }
  return filterPastConfirmedRows([...byId.values()], nowMs);
}

/**
 * Upcoming + Canceled: full list. Past: month windows with optional load more.
 *
 * @param {{ listEnabled?: boolean }} [options]
 */
export function useBookingsList(options = {}) {
  const { listEnabled = true } = options;
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const [listFilter, setListFilter] = useState(BOOKINGS_FILTER_UPCOMING);

  const isPastFilter = listFilter === BOOKINGS_FILTER_PAST;

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

  const fullListQ = useQuery({
    queryKey: bookingsListQueryKey(businessId, listFilter),
    queryFn: async () => {
      const nowMs = Date.now();
      if (listFilter === BOOKINGS_FILTER_UPCOMING) {
        const { data, error } = await fetchConfirmedBookingsFromToday(businessId);
        if (error) {
          throw new Error(error.message ?? 'Could not load bookings');
        }
        return partitionUpcomingConfirmed(data ?? [], nowMs).upcoming;
      }
      if (listFilter === BOOKINGS_FILTER_CANCELLED) {
        const { data, error } = await fetchCancelledBookingsForBusiness(businessId);
        if (error) {
          throw new Error(error.message ?? 'Could not load bookings');
        }
        return sortCancelledBookingsForList(data ?? []);
      }
      return [];
    },
    enabled: hasBusinessRow && listEnabled && !isPastFilter,
    staleTime: 45 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: shouldRetryBookingsQuery,
    retryDelay: 400,
  });

  const pastListQ = useInfiniteQuery({
    queryKey: bookingsListQueryKey(businessId, BOOKINGS_FILTER_PAST),
    initialPageParam: getInitialListMonthWindow(BOOKINGS_FILTER_PAST),
    queryFn: async ({ pageParam }) => {
      const windows = listMonthWindowsFromPageParam(pageParam);
      const allRows = [];

      for (const window of windows) {
        const { data, error } = await fetchBookingsForListWindow(
          businessId,
          BOOKINGS_FILTER_PAST,
          window.start,
          window.end,
        );
        if (error) {
          throw new Error(error.message ?? 'Could not load bookings');
        }
        allRows.push(...(data ?? []));
      }

      return {
        window: windows[windows.length - 1],
        bookings: allRows,
      };
    },
    getNextPageParam: (lastPage) => getNextListMonthWindow(BOOKINGS_FILTER_PAST, lastPage.window),
    enabled: hasBusinessRow && listEnabled && isPastFilter,
    staleTime: 45 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: shouldRetryBookingsQuery,
    retryDelay: 400,
  });

  const bookings = useMemo(() => {
    if (isPastFilter) {
      const pages = pastListQ.data?.pages ?? [];
      if (pages.length === 0) {
        return [];
      }
      return mergePastListPages(pages, Date.now());
    }
    return fullListQ.data ?? [];
  }, [isPastFilter, pastListQ.data?.pages, fullListQ.data]);

  const nextPastWindow = useMemo(() => {
    const pages = pastListQ.data?.pages ?? [];
    if (pages.length === 0) {
      return getNextListMonthWindow(
        BOOKINGS_FILTER_PAST,
        getInitialListMonthWindow(BOOKINGS_FILTER_PAST),
      );
    }
    return getNextListMonthWindow(BOOKINGS_FILTER_PAST, pages[pages.length - 1].window);
  }, [pastListQ.data?.pages]);

  const loadMoreLabel = useMemo(
    () => getLoadMoreLabel(BOOKINGS_FILTER_PAST, nextPastWindow),
    [nextPastWindow],
  );

  const businessError = businessQ.isError
    ? (businessQ.error?.message ?? 'Could not load business')
    : null;

  const listError = isPastFilter
    ? pastListQ.isError
      ? (pastListQ.error?.message ?? 'Could not load bookings')
      : null
    : fullListQ.isError
      ? (fullListQ.error?.message ?? 'Could not load bookings')
      : null;

  const isPendingBusiness = Boolean(userId) && businessQ.isPending;
  const isPendingList =
    hasBusinessRow && listEnabled && (isPastFilter ? pastListQ.isPending : fullListQ.isPending);
  const isLoading = isPendingBusiness || isPendingList;

  const refetch = useCallback(async () => {
    await queryClient.refetchQueries({ queryKey: BOOKINGS_QUERY_ROOT });
    if (userId) {
      await queryClient.refetchQueries({ queryKey: homeBusinessProfileQueryKey(userId) });
    }
  }, [queryClient, userId]);

  const loadMore = useCallback(() => {
    if (!pastListQ.hasNextPage || pastListQ.isFetchingNextPage) {
      return;
    }
    void pastListQ.fetchNextPage();
  }, [pastListQ]);

  return {
    business,
    businessError,
    listError,
    bookings,
    listFilter,
    setListFilter,
    isPendingBusiness,
    isPendingList,
    isLoading,
    isFetching:
      businessQ.isFetching ||
      (listEnabled && (isPastFilter ? pastListQ.isFetching : fullListQ.isFetching)),
    isFetchingNextPage: isPastFilter ? pastListQ.isFetchingNextPage : false,
    hasNextPage: isPastFilter && Boolean(pastListQ.hasNextPage && nextPastWindow),
    loadMoreLabel,
    loadMorePresentation: 'link',
    loadMore,
    refetch,
  };
}
