import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { fetchCompletedBookingPayments } from '../api/fetchCompletedBookingPayments';
import { REVENUE_RANGE } from '../constants/paymentsRevenueRanges';
import { paymentsRevenueQueryKey } from '../queryKeys';
import { aggregatePaymentsRevenue } from '../utils/aggregatePaymentsRevenue';
import { revenueDateWindow } from '../utils/revenueDateWindows';

/**
 * Completed-booking revenue for the Payments Revenue tab (amount + chart).
 *
 * @param {{ businessId: string | null | undefined }} args
 */
export function usePaymentsRevenue({ businessId }) {
  const [range, setRange] = useState(REVENUE_RANGE.MONTH);
  const window = useMemo(() => revenueDateWindow(range), [range]);

  const revenueQ = useQuery({
    queryKey: paymentsRevenueQueryKey(businessId, range),
    queryFn: async () => {
      const currentPromise = fetchCompletedBookingPayments({
        businessId,
        fromYmd: window.fromYmd,
        toYmd: window.toYmd,
      });

      const needsPrevious = range !== REVENUE_RANGE.ALL && window.prevFromYmd && window.prevToYmd;
      const previousPromise = needsPrevious
        ? fetchCompletedBookingPayments({
            businessId,
            fromYmd: window.prevFromYmd,
            toYmd: window.prevToYmd,
          })
        : Promise.resolve({ data: [], error: null });

      const [current, previous] = await Promise.all([currentPromise, previousPromise]);
      if (current.error) {
        throw new Error(current.error.message ?? 'Could not load revenue');
      }
      if (previous.error) {
        throw new Error(previous.error.message ?? 'Could not load revenue');
      }

      return {
        currentRows: current.data ?? [],
        previousRows: previous.data ?? [],
      };
    },
    enabled: Boolean(businessId),
    staleTime: 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const summary = useMemo(
    () =>
      aggregatePaymentsRevenue({
        range,
        currentRows: revenueQ.data?.currentRows ?? [],
        previousRows: revenueQ.data?.previousRows ?? [],
      }),
    [range, revenueQ.data?.currentRows, revenueQ.data?.previousRows],
  );

  return {
    range,
    setRange,
    summary,
    isPending: Boolean(businessId) && revenueQ.isPending,
    isError: revenueQ.isError,
    errorMessage: revenueQ.isError ? (revenueQ.error?.message ?? 'Could not load revenue') : null,
    refetch: revenueQ.refetch,
  };
}
