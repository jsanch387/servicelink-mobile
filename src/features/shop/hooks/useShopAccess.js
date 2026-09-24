import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useAuth } from '../../auth';
import { shopProfileQueryOptions } from '../shopProfileQueryOptions';
import { resolveShopCapabilities } from '../utils/resolveShopCapabilities';

export function useShopAccess() {
  const { user } = useAuth();
  const userId = user?.id;
  const shopQuery = useQuery(shopProfileQueryOptions(userId));
  const shopReady = shopQuery.isFetched && !(shopQuery.isFetching && !shopQuery.data?.id);

  return useMemo(
    () => ({
      ...resolveShopCapabilities(shopQuery.data, userId, { shopReady }),
      isShopLoading: !shopReady,
    }),
    [shopQuery.data, shopReady, userId],
  );
}
