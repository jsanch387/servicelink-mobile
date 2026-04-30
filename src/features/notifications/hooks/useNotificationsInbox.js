import { useQuery } from '@tanstack/react-query';
import { fetchNotificationsInbox } from '../api/fetchNotificationsInbox';
import { notificationsInboxQueryKey } from '../queryKeys';

export function useNotificationsInbox() {
  const query = useQuery({
    queryKey: notificationsInboxQueryKey(),
    queryFn: fetchNotificationsInbox,
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  return {
    items: query.data ?? [],
    isLoading: query.isPending,
    isFetching: query.isFetching,
    loadError: query.isError ? (query.error?.message ?? 'Could not load notifications') : null,
    refetch: query.refetch,
  };
}
