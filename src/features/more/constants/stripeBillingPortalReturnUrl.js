/**
 * Prefix used by `WebBrowser.openAuthSessionAsync` for Stripe Billing Portal return.
 * Server `STRIPE_MOBILE_BILLING_PORTAL_RETURN_URL` should start with this prefix.
 */
export const STRIPE_BILLING_PORTAL_AUTH_RETURN_URL =
  String(process.env.EXPO_PUBLIC_STRIPE_BILLING_PORTAL_AUTH_RETURN_URL ?? '').trim() ||
  'servicelinkmobile://settings/subscription';
