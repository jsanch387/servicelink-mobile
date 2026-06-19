import { usePaymentDashboardRead } from '../../payments/hooks/usePaymentDashboardRead';

/**
 * Stripe Connect readiness for Tap to Pay on the Complete sheet.
 * Matches Payments tab gating (`onboarding_status === 'complete'` + `charges_enabled`).
 */
export function useTapToPayConnectReadiness() {
  const dashboard = usePaymentDashboardRead();

  return {
    isConnectReady: dashboard.stripeConnectReady,
    isLoading: dashboard.isPendingPayments,
    loadError: dashboard.paymentLoadError,
    merchantDisplayName: dashboard.business?.business_name ?? null,
    refetch: dashboard.refetchPayments,
  };
}
