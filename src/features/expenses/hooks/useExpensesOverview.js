import { useQuery } from '@tanstack/react-query';
import { fetchExpensesForBusiness } from '../api/expenses';
import { expensesOverviewQueryKey } from '../queryKeys';
import { expenseOverviewFetchWindow } from '../utils/expenseWindows';
import { useExpenseBusiness } from './useExpenseBusiness';

/**
 * Expenses for the overview chart and totals. Does not run while the list tab is open.
 *
 * @param {{ range: string; customFromYmd?: string | null; customToYmd?: string | null; enabled?: boolean }} params
 */
export function useExpensesOverview({
  range,
  customFromYmd = null,
  customToYmd = null,
  enabled = true,
}) {
  const { businessId, isPendingBusiness, businessError } = useExpenseBusiness();
  const fetchWindow = expenseOverviewFetchWindow(range, new Date(), {
    fromYmd: customFromYmd,
    toYmd: customToYmd,
  });

  const overviewQ = useQuery({
    queryKey: expensesOverviewQueryKey(businessId, range, fetchWindow?.fromYmd, fetchWindow?.toYmd),
    queryFn: async () => {
      const { data, error } = await fetchExpensesForBusiness(businessId, fetchWindow ?? {});
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
    businessId,
    expenses: overviewQ.data ?? [],
    isLoading: isPendingBusiness || (Boolean(businessId) && enabled && overviewQ.isPending),
    error:
      businessError ??
      (overviewQ.isError ? (overviewQ.error?.message ?? 'Could not load expenses') : null),
  };
}
