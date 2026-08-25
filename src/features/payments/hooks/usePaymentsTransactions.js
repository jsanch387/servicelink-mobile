import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useAuth } from '../../auth';
import { fetchPaymentsTransactions } from '../api/fetchPaymentsTransactions';
import { fetchTransactionBookingLabels } from '../api/fetchTransactionBookingLabels';
import { PAYMENTS_TRANSACTIONS_PAGE_SIZE } from '../constants/paymentsTransactions';
import { paymentsTransactionsQueryKey } from '../queryKeys';
import {
  isGenericMultiJobTitle,
  stripGenericMultiJobLabel,
} from '../utils/splitPaymentsTransactionTitle';
import { bookingLabelLookupArgs } from '../utils/transactionNeedsBookingLabel';

function realServiceName(value) {
  const raw = stripGenericMultiJobLabel(value);
  return raw && !isGenericMultiJobTitle(raw) ? raw : '';
}

/**
 * Payments → Transactions feed (balance + activity pages).
 *
 * @param {{ enabled?: boolean }} [args]
 */
export function usePaymentsTransactions({ enabled = true } = {}) {
  const { session } = useAuth();
  const accessToken = session?.access_token ?? '';

  const query = useInfiniteQuery({
    queryKey: paymentsTransactionsQueryKey(),
    queryFn: async ({ pageParam }) => {
      const result = await fetchPaymentsTransactions(accessToken, {
        limit: PAYMENTS_TRANSACTIONS_PAGE_SIZE,
        startingAfter: pageParam,
      });
      if (!result.ok) {
        throw result.error;
      }
      return result.page;
    },
    initialPageParam: /** @type {string | null} */ (null),
    getNextPageParam: (lastPage) => {
      if (!lastPage?.hasMore || !lastPage.nextCursor) {
        return undefined;
      }
      return lastPage.nextCursor;
    },
    enabled: Boolean(enabled && accessToken),
    staleTime: 45 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const pages = query.data?.pages ?? [];
  const items = useMemo(() => pages.flatMap((page) => page.items), [pages]);
  const lookupArgs = useMemo(() => bookingLabelLookupArgs(items), [items]);
  const labelsQ = useQuery({
    queryKey: [...paymentsTransactionsQueryKey(), 'booking-labels', lookupArgs],
    queryFn: () => fetchTransactionBookingLabels(lookupArgs),
    enabled: Boolean(
      enabled && accessToken && (lookupArgs.bookingIds.length > 0 || lookupArgs.paymentIds.length > 0),
    ),
    staleTime: 5 * 60 * 1000,
  });
  const resolvedItems = useMemo(() => {
    const labels = labelsQ.data ?? {};
    return items.map((item) => {
      const label = labels[item.bookingId] || labels[item.id] || null;
      if (!label) return item;
      return {
        ...item,
        serviceName: realServiceName(item.serviceName) || label.serviceName,
        extraCount: item.extraCount > 0 ? item.extraCount : label.extraCount || 0,
      };
    });
  }, [items, labelsQ.data]);
  const balance = pages[0]?.balance ?? {
    availableCaption: 'Available',
    pendingCaption: 'On the way',
    availableLabel: '$0.00',
    pendingLabel: '$0.00',
  };

  return {
    balance,
    items: resolvedItems,
    hasMore: Boolean(query.hasNextPage),
    isLoading: query.isPending,
    isFetchingMore: query.isFetchingNextPage,
    errorMessage:
      pages.length === 0 && query.error
        ? query.error instanceof Error
          ? query.error.message
          : String(query.error)
        : null,
    refetch: query.refetch,
    fetchMore: () => {
      if (!query.hasNextPage || query.isFetchingNextPage) {
        return;
      }
      void query.fetchNextPage();
    },
  };
}
