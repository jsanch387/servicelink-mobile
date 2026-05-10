import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useAuth } from '../../auth';
import {
  fetchRecentNotificationsPage,
  fetchUnreadNotificationsInbox,
  NOTIFICATIONS_RECENT_PAGE_SIZE,
} from '../api/fetchNotificationsInbox';
import { notificationsInboxQueryKey } from '../queryKeys';

/**
 * @param {'unread' | 'recent'} scope
 */
export function useNotificationsInbox(scope) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const enabled = Boolean(userId);

  const unreadQuery = useQuery({
    queryKey: notificationsInboxQueryKey(userId, 'unread'),
    queryFn: () => fetchUnreadNotificationsInbox(userId),
    enabled: enabled && scope === 'unread',
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const recentQuery = useInfiniteQuery({
    queryKey: notificationsInboxQueryKey(userId, 'recent'),
    queryFn: ({ pageParam }) => fetchRecentNotificationsPage(userId, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < NOTIFICATIONS_RECENT_PAGE_SIZE) {
        return undefined;
      }
      return allPages.length * NOTIFICATIONS_RECENT_PAGE_SIZE;
    },
    enabled: enabled && scope === 'recent',
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  if (scope === 'unread') {
    const unreadHasData = unreadQuery.data !== undefined;
    return {
      items: unreadQuery.data ?? [],
      isLoading: unreadQuery.isPending,
      isFetching: unreadQuery.isFetching,
      loadError:
        unreadQuery.isError && !unreadHasData
          ? (unreadQuery.error?.message ?? 'Could not load notifications')
          : null,
      refetch: unreadQuery.refetch,
      fetchNextPage: async () => {},
      hasNextPage: false,
      isFetchingNextPage: false,
    };
  }

  const items = recentQuery.data?.pages.flat() ?? [];
  const recentHasData = recentQuery.data !== undefined;

  return {
    items,
    isLoading: recentQuery.isPending,
    isFetching: recentQuery.isFetching,
    loadError:
      recentQuery.isError && !recentHasData
        ? (recentQuery.error?.message ?? 'Could not load notifications')
        : null,
    refetch: recentQuery.refetch,
    fetchNextPage: recentQuery.fetchNextPage,
    hasNextPage: Boolean(recentQuery.hasNextPage),
    isFetchingNextPage: recentQuery.isFetchingNextPage,
  };
}
