// Stripe mobile domain hub (non-breaking re-exports).
// Keep existing imports working while giving one discoverable Stripe entrypoint.

// Onboarding trial (silent start + confirm-after-checkout; see docs/nextjs-onboarding-trial-contract.md)
export { startOnboardingTrial } from '../onboarding/api/startOnboardingTrial';
export { confirmOnboardingTrial } from '../onboarding/api/confirmOnboardingTrial';
export { createOnboardingCheckoutSession } from '../onboarding/api/createOnboardingCheckoutSession';
export { STRIPE_ONBOARDING_CHECKOUT_AUTH_RETURN_URL } from '../onboarding/constants/stripeOnboardingReturnUrl';

// Paywall upgrade checkout
export { createPaywallUpgradeCheckoutSession } from '../subscription/api/createPaywallUpgradeCheckoutSession';
export { STRIPE_PAYWALL_CHECKOUT_AUTH_RETURN_URL } from '../subscription/constants/stripePaywallCheckoutReturnUrl';

// Billing portal
export { createBillingPortalSession } from '../more/api/createBillingPortalSession';
export { STRIPE_BILLING_PORTAL_AUTH_RETURN_URL } from '../more/constants/stripeBillingPortalReturnUrl';

// Connect onboarding + sync + enable
export { postStripeConnectOnboard } from '../payments/api/postStripeConnectOnboard';
export { postStripeConnectSync } from '../payments/api/postStripeConnectSync';
export { fetchStripeExpressDashboardUrl } from '../payments/api/stripeExpressDashboard';
export { postPaymentsServicelinkEnable } from '../payments/api/postPaymentsServicelinkEnable';
export { enableServicelinkPaymentsViaSupabase } from '../payments/api/enableServicelinkPaymentsViaSupabase';
export { STRIPE_CONNECT_ONBOARDING_AUTH_RETURN_URL } from '../payments/constants/stripeConnectReturnUrl';
