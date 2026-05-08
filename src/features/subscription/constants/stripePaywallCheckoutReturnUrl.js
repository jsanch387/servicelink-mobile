/**
 * Prefix for `WebBrowser.openAuthSessionAsync` `redirectUrl`. Stripe success/cancel URLs from the
 * server (`STRIPE_MOBILE_UPGRADE_SUCCESS_URL`, `STRIPE_MOBILE_UPGRADE_CANCEL_URL`) must start with
 * this prefix (query strings after the path are OK).
 *
 * Example server env:
 * - `STRIPE_MOBILE_UPGRADE_SUCCESS_URL="servicelinkmobile://paywall/stripe?result=success"`
 * - `STRIPE_MOBILE_UPGRADE_CANCEL_URL="servicelinkmobile://paywall/stripe?result=cancel"`
 *
 * Override: `EXPO_PUBLIC_STRIPE_PAYWALL_CHECKOUT_AUTH_RETURN_URL`.
 */
export const STRIPE_PAYWALL_CHECKOUT_AUTH_RETURN_URL =
  String(process.env.EXPO_PUBLIC_STRIPE_PAYWALL_CHECKOUT_AUTH_RETURN_URL ?? '').trim() ||
  'servicelinkmobile://paywall/stripe';
