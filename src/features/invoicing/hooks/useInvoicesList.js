import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useAuth } from '../../auth';
import { useSubscription } from '../../subscription';
import { useShopAccess } from '../../shop';
import { shopProfileQueryOptions } from '../../shop/shopProfileQueryOptions';
import { fetchInvoicesForBusiness } from '../api/invoices';
import { invoicesListQueryKey } from '../queryKeys';

/**
 * Full invoice list for the current shop. Status filters stay in memory.
 * The query stays off until the existing owner and Pro gates both pass.
 */
export function useInvoicesList() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const businessQ = useQuery(shopProfileQueryOptions(userId));
  const { canSeeOffice, isShopLoading } = useShopAccess();
  const {
    hasProAccess,
    isOwnerProfileLoaded,
    isLoading: subscriptionLoading,
    loadError: subscriptionError,
    refetchSubscription,
  } = useSubscription();

  const businessId = businessQ.data?.id ?? null;
  const allowed =
    Boolean(userId) && !isShopLoading && isOwnerProfileLoaded && canSeeOffice && hasProAccess;
  const listQ = useQuery({
    queryKey: invoicesListQueryKey(businessId),
    queryFn: async () => {
      const { data, error } = await fetchInvoicesForBusiness(businessId);
      if (error) {
        throw new Error(error.message ?? 'Could not load invoices');
      }
      return data ?? [];
    },
    enabled: allowed && Boolean(businessId),
    staleTime: 30 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const businessError = businessQ.isError
    ? (businessQ.error?.message ?? 'Could not load business')
    : null;
  const listError = listQ.isError ? (listQ.error?.message ?? 'Could not load invoices') : null;

  const refetch = useCallback(async () => {
    const tasks = [];
    if (subscriptionError) tasks.push(refetchSubscription());
    if (businessQ.isError || !businessId) tasks.push(businessQ.refetch());
    if (allowed && businessId) tasks.push(listQ.refetch());
    await Promise.all(tasks);
  }, [allowed, businessId, businessQ, listQ, refetchSubscription, subscriptionError]);

  return {
    invoices: listQ.data ?? [],
    isLoading:
      Boolean(userId) &&
      (isShopLoading ||
        subscriptionLoading ||
        businessQ.isPending ||
        (allowed && Boolean(businessId) && listQ.isPending)),
    error: subscriptionError || businessError || listError,
    isFetching: listQ.isFetching || businessQ.isFetching,
    refetch,
    /** Owner and Pro. The list renders only after this is true. */
    canRead: allowed,
  };
}
