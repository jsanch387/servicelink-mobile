import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { fetchNotificationSettings } from '../api/fetchNotificationSettings';
import { notificationSettingsQueryKey } from '../queryKeys';

export function useNotificationSettings() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: notificationSettingsQueryKey(),
    queryFn: fetchNotificationSettings,
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const setPref = useCallback(
    (key, value) => {
      queryClient.setQueryData(notificationSettingsQueryKey(), (prev) => {
        if (!prev) return prev;
        return { ...prev, [key]: value };
      });
    },
    [queryClient],
  );

  return {
    prefs: query.data ?? null,
    isLoading: query.isPending,
    isFetching: query.isFetching,
    loadError: query.isError ? (query.error?.message ?? 'Could not load settings') : null,
    refetch: query.refetch,
    setPref,
  };
}
