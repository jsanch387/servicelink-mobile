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

  /** Account bundle fetch succeeded — safe for screens that read `ownerProfile` (e.g. Payments). */
  const isOwnerProfileLoaded = Boolean(userId) && query.isSuccess;

  /**
   * When false, subscription/profile data may still be reconciling after onboarding refetch.
   */
  const isPaywallDataStable = useMemo(() => {
    if (!userId || !query.isSuccess) {
      return false;
    }
    if (hasProAccess) {
      return true;
    }
    return !query.isFetching;
  }, [userId, query.isSuccess, query.isFetching, hasProAccess]);

  const isReady = !userId || query.isSuccess || query.isError;

  const refetchSubscription = useCallback(async () => {
    if (!userId) return;
    await qc.refetchQueries({ queryKey: accountSettingsQueryKey(userId) });
  }, [qc, userId]);

  const value = useMemo(
    () => ({
      ownerProfile,
      hasProAccess,
      isOwnerProfileLoaded,
      isPaywallDataStable,
      isReady,
      isLoading: Boolean(userId) && query.isPending,
      loadError: query.isError ? (query.error?.message ?? 'Could not load subscription') : null,
      refetchSubscription,
    }),
    [
      ownerProfile,
      hasProAccess,
      isOwnerProfileLoaded,
      isPaywallDataStable,
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
