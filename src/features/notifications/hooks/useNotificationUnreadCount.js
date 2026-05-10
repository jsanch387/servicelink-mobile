import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../auth';
import { fetchNotificationUnreadCount } from '../api/fetchNotificationUnreadCount';
import { notificationUnreadCountQueryKey } from '../queryKeys';

export function useNotificationUnreadCount() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const query = useQuery({
    queryKey: notificationUnreadCountQueryKey(userId),
    queryFn: () => fetchNotificationUnreadCount(userId),
    enabled: Boolean(userId),
    staleTime: 15 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  return {
    unreadCount: query.data ?? 0,
    isLoading: query.isPending,
    loadError: query.isError ? (query.error?.message ?? 'Could not load notifications') : null,
    refetch: query.refetch,
  };
}
