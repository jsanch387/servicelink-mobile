import { usePaymentDashboardRead } from '../../payments/hooks/usePaymentDashboardRead';

/**
 * Stripe Connect readiness for Tap to Pay on the Complete sheet.
 * Matches Payments tab gating (`onboarding_status === 'complete'` + `charges_enabled`).
 */
export function useTapToPayConnectReadiness() {
  const dashboard = usePaymentDashboardRead();

  return {
    isConnectReady: dashboard.stripeConnectReady,
    isLoading: dashboard.isPendingPayments || dashboard.isPendingBusiness,
    loadError: dashboard.paymentLoadError ?? dashboard.businessError,
    businessId: dashboard.business?.id ?? null,
    merchantDisplayName: dashboard.business?.business_name ?? null,
    terminalLocationId: dashboard.paymentAccount?.stripe_terminal_location_id ?? null,
    stripeAccountId: dashboard.paymentAccount?.stripe_account_id ?? null,
    refetch: dashboard.refetchPayments,
  };
}
