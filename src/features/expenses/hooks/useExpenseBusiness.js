import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../auth';
import { shopProfileQueryOptions } from '../../shop/shopProfileQueryOptions';

export function useExpenseBusiness() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const businessQ = useQuery(shopProfileQueryOptions(userId));
  const businessId = businessQ.data?.id ?? null;

  return {
    userId,
    businessId,
    isPendingBusiness: Boolean(userId) && businessQ.isPending,
    businessError: businessQ.isError
      ? (businessQ.error?.message ?? 'Could not load business')
      : null,
  };
}
