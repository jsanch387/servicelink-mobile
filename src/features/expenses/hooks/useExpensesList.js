import { useQuery } from '@tanstack/react-query';
import { fetchExpensesForBusiness } from '../api/expenses';
import { expensesListQueryKey } from '../queryKeys';
import { useExpenseBusiness } from './useExpenseBusiness';

/**
 * Full register, loaded only after the list tab is opened.
 *
 * @param {{ enabled?: boolean }} [params]
 */
export function useExpensesList({ enabled = false } = {}) {
  const { businessId, isPendingBusiness, businessError } = useExpenseBusiness();

  const listQ = useQuery({
    queryKey: expensesListQueryKey(businessId),
    queryFn: async () => {
      const { data, error } = await fetchExpensesForBusiness(businessId);
      if (error) {
        throw new Error(error.message ?? 'Could not load expenses');
      }
      return data ?? [];
    },
    enabled: enabled && Boolean(businessId),
    staleTime: 30 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  return {
    expenses: listQ.data ?? [],
    isLoading: isPendingBusiness || (Boolean(businessId) && enabled && listQ.isPending),
    error:
      businessError ?? (listQ.isError ? (listQ.error?.message ?? 'Could not load expenses') : null),
  };
}
