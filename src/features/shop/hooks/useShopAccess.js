import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useAuth } from '../../auth';
import { fetchBusinessMembershipForUser } from '../../home/api/homeDashboard';
import { shopProfileQueryOptions } from '../shopProfileQueryOptions';
import { activeBusinessMembershipQueryKey } from '../queryKeys';
import { resolveShopCapabilities } from '../utils/resolveShopCapabilities';

export function useShopAccess() {
  const { user } = useAuth();
  const userId = user?.id;
  const shopQuery = useQuery(shopProfileQueryOptions(userId));
  const membershipQuery = useQuery({
    queryKey: activeBusinessMembershipQueryKey(userId),
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await fetchBusinessMembershipForUser(userId);
      if (error) {
        throw error;
      }
      return data;
    },
    staleTime: 15_000,
  });
  const shopReady = shopQuery.isFetched && !(shopQuery.isFetching && !shopQuery.data?.id);
  const membershipRole =
    membershipQuery.data?.status === 'active' ? membershipQuery.data.role : null;

  return useMemo(
    () => ({
      ...resolveShopCapabilities(shopQuery.data, userId, { shopReady, membershipRole }),
      isShopLoading: !shopReady,
    }),
    [membershipRole, shopQuery.data, shopReady, userId],
  );
}
