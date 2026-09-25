import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchExpenseMonthPage } from '../api/expenses';
import { expensesListQueryKey } from '../queryKeys';
import { useExpenseBusiness } from './useExpenseBusiness';

/**
 * Register by month, loaded only after the list tab is opened.
 * The first page is the newest month that has a charge. Load more asks for the month before that.
 *
 * @param {{ enabled?: boolean }} [params]
 */
export function useExpensesList({ enabled = false } = {}) {
  const { businessId, isPendingBusiness, businessError } = useExpenseBusiness();

  const listQ = useInfiniteQuery({
    queryKey: expensesListQueryKey(businessId),
    queryFn: async ({ pageParam }) => {
      const { data, error } = await fetchExpenseMonthPage(businessId, pageParam);
      if (error) {
        throw new Error(error.message ?? 'Could not load expenses');
      }
      return data ?? { expenses: [], monthKey: null, hasOlder: false };
    },
    initialPageParam: /** @type {string | null} */ (null),
    getNextPageParam: (lastPage) => {
      if (!lastPage?.hasOlder || !lastPage.monthKey) return undefined;
      return `${lastPage.monthKey}-01`;
    },
    enabled: enabled && Boolean(businessId),
    staleTime: 30 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const hasData = listQ.data !== undefined;

  return {
    expenses: listQ.data?.pages.flatMap((page) => page.expenses ?? []) ?? [],
    isLoading: isPendingBusiness || (Boolean(businessId) && enabled && listQ.isPending),
    hasNextPage: Boolean(listQ.hasNextPage),
    isFetchingNextPage: listQ.isFetchingNextPage,
    fetchNextPage: listQ.fetchNextPage,
    error:
      businessError ??
      (listQ.isError && !hasData ? (listQ.error?.message ?? 'Could not load expenses') : null),
  };
}
