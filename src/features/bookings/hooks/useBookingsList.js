import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
  getInitialPastListPageParam,
  getLoadMoreLabel,
  getNextListMonthWindow,
  listMonthWindowsFromPageParam,
  PAST_AUTO_BACKFILL_MAX_MONTHS,
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
    initialPageParam: getInitialPastListPageParam(),
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
        monthCount: windows.length,
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

  const pastCoveredMonthCount = useMemo(() => {
    if (!isPastFilter) {
      return 0;
    }
    const pages = pastListQ.data?.pages ?? [];
    return pages.reduce((sum, page) => sum + (page.monthCount ?? 1), 0);
  }, [isPastFilter, pastListQ.data?.pages]);

  const pastPageCount = pastListQ.data?.pages?.length ?? 0;

  const nextPastWindow = useMemo(() => {
    const pages = pastListQ.data?.pages ?? [];
    if (pages.length === 0) {
      const initialWindows = listMonthWindowsFromPageParam(getInitialPastListPageParam());
      const lastInitial = initialWindows[initialWindows.length - 1];
      return getNextListMonthWindow(BOOKINGS_FILTER_PAST, lastInitial);
    }
    return getNextListMonthWindow(BOOKINGS_FILTER_PAST, pages[pages.length - 1].window);
  }, [pastListQ.data?.pages]);

  const hasNextPage = isPastFilter && Boolean(pastListQ.hasNextPage && nextPastWindow);

  const shouldAutoBackfillPast =
    isPastFilter &&
    Boolean(pastListQ.isSuccess) &&
    bookings.length === 0 &&
    hasNextPage &&
    pastCoveredMonthCount > 0 &&
    pastCoveredMonthCount < PAST_AUTO_BACKFILL_MAX_MONTHS &&
    !pastListQ.isFetchingNextPage &&
    !pastListQ.isError;

  const fetchNextPastPage = pastListQ.fetchNextPage;

  useEffect(() => {
    if (!shouldAutoBackfillPast) {
      return;
    }
    void fetchNextPastPage();
  }, [shouldAutoBackfillPast, fetchNextPastPage, pastPageCount]);

  const isBackfillingPast =
    isPastFilter &&
    bookings.length === 0 &&
    hasNextPage &&
    pastCoveredMonthCount > 0 &&
    pastCoveredMonthCount < PAST_AUTO_BACKFILL_MAX_MONTHS &&
    (pastListQ.isFetchingNextPage || shouldAutoBackfillPast);

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
  const isLoading = isPendingBusiness || isPendingList || isBackfillingPast;

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
    isBackfillingPast,
    isFetching:
      businessQ.isFetching ||
      (listEnabled && (isPastFilter ? pastListQ.isFetching : fullListQ.isFetching)),
    isFetchingNextPage: isPastFilter ? pastListQ.isFetchingNextPage && !isBackfillingPast : false,
    hasNextPage,
    loadMoreLabel,
    loadMorePresentation: 'link',
    loadMore,
    refetch,
  };
}
