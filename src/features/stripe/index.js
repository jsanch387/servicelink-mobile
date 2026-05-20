// Stripe mobile domain hub (non-breaking re-exports).
// Keep existing imports working while giving one discoverable Stripe entrypoint.

// Connect onboarding + sync + enable (merchant payments — not app subscription purchase)
export { postStripeConnectOnboard } from '../payments/api/postStripeConnectOnboard';
export { postStripeConnectSync } from '../payments/api/postStripeConnectSync';
export { fetchStripeExpressDashboardUrl } from '../payments/api/stripeExpressDashboard';
export { postPaymentsServicelinkEnable } from '../payments/api/postPaymentsServicelinkEnable';
export { enableServicelinkPaymentsViaSupabase } from '../payments/api/enableServicelinkPaymentsViaSupabase';
export { STRIPE_CONNECT_ONBOARDING_AUTH_RETURN_URL } from '../payments/constants/stripeConnectReturnUrl';
