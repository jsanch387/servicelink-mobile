import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo } from 'react';
import { useAuth } from '../../auth';
import { fetchBusinessProfileForUser } from '../../home/api/homeDashboard';
import { homeBusinessProfileQueryKey } from '../../home/queryKeys';
import { fetchPaymentDashboardRows, isStripeConnectReady } from '../api/fetchPaymentDashboard';
import { PAYMENTS_QUERY_ROOT, paymentsDashboardQueryKey } from '../queryKeys';
import { mapPaymentSettingsToFormHydration } from '../utils/paymentSettingsMaps';

export function usePaymentDashboardRead() {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();

  useFocusEffect(
    useCallback(() => {
      void queryClient.refetchQueries({
        queryKey: PAYMENTS_QUERY_ROOT,
        type: 'active',
        stale: true,
      });
    }, [queryClient]),
  );

  const businessQ = useQuery({
    queryKey: homeBusinessProfileQueryKey(userId),
    queryFn: async () => {
      const { data, error } = await fetchBusinessProfileForUser(userId);
      if (error) {
        throw new Error(error.message ?? 'Could not load business');
      }
      return data;
    },
    enabled: Boolean(userId),
    staleTime: 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const businessId = businessQ.data?.id ?? null;

  const dashboardQ = useQuery({
    queryKey: paymentsDashboardQueryKey(businessId),
    queryFn: () => fetchPaymentDashboardRows(businessId),
    enabled: Boolean(businessId),
    staleTime: 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const paymentAccount = dashboardQ.data?.paymentAccount ?? null;
  const paymentSettings = dashboardQ.data?.paymentSettings ?? null;

  const stripeConnectReady = useMemo(() => isStripeConnectReady(paymentAccount), [paymentAccount]);
  const hasPaymentSettingsRow = paymentSettings != null;
  const gateServicelinkCheckout = stripeConnectReady && !hasPaymentSettingsRow;

  const formHydration = useMemo(
    () => mapPaymentSettingsToFormHydration(paymentSettings),
    [paymentSettings],
  );

  const businessError = businessQ.isError
    ? (businessQ.error?.message ?? 'Could not load business')
    : null;
  const paymentLoadError = dashboardQ.isError
    ? (dashboardQ.error?.message ?? 'Could not load payment settings')
    : null;

  const isPendingBusiness = Boolean(userId) && businessQ.isPending;
  const isPendingPayments = Boolean(businessId) && dashboardQ.isPending;

  return {
    business: businessQ.data ?? null,
    businessError,
    paymentAccount,
    paymentSettings,
    stripeConnectReady,
    hasPaymentSettingsRow,
    gateServicelinkCheckout,
    formHydration,
    paymentsQuerySuccess: dashboardQ.isSuccess,
    paymentLoadError,
    isPendingBusiness,
    isPendingPayments,
    refetchPayments: dashboardQ.refetch,
  };
}
