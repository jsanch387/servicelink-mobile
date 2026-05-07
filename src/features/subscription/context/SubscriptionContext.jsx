import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useMemo } from 'react';
import { useAuth } from '../../auth';
import { fetchAccountSettingsBundle } from '../../more/api/fetchAccountSettings';
import { accountSettingsQueryKey } from '../../more/queryKeys';
import { hasProAccessFromProfile } from '../../more/utils/subscriptionPresentation';

const SubscriptionContext = createContext(null);

export function SubscriptionProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: accountSettingsQueryKey(userId),
    queryFn: async () => {
      const { ownerProfile, business, error } = await fetchAccountSettingsBundle(userId);
      if (error) throw error;
      return { ownerProfile, business };
    },
    enabled: Boolean(userId),
    staleTime: 45 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const ownerProfile = query.data?.ownerProfile ?? null;
  const hasProAccess = useMemo(() => hasProAccessFromProfile(ownerProfile), [ownerProfile]);

  const isReady = !userId || query.isSuccess || query.isError;

  const refetchSubscription = useCallback(async () => {
    if (!userId) return;
    await qc.invalidateQueries({ queryKey: accountSettingsQueryKey(userId) });
  }, [qc, userId]);

  const value = useMemo(
    () => ({
      ownerProfile,
      hasProAccess,
      isReady,
      isLoading: Boolean(userId) && query.isPending,
      loadError: query.isError ? (query.error?.message ?? 'Could not load subscription') : null,
      refetchSubscription,
    }),
    [
      ownerProfile,
      hasProAccess,
      isReady,
      userId,
      query.isPending,
      query.isError,
      query.error,
      refetchSubscription,
    ],
  );

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) {
    throw new Error('useSubscription must be used within SubscriptionProvider');
  }
  return ctx;
}
