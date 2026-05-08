/**
 * Redirect prefix passed to `WebBrowser.openAuthSessionAsync` for Stripe Connect onboarding.
 *
 * Contract v2 (bridge flow):
 * - Stripe Account Link `return_url` / `refresh_url` on the server must be HTTPS bridge routes
 *   (for example `/mobile-bridge/connect-return` and `/mobile-bridge/connect-refresh`).
 * - Bridge pages then deep-link to app URLs that start with this prefix (default below), e.g.
 *   `servicelinkmobile://payments/connect?connect=return` / `...?connect=refresh`.
 *
 * Stripe rejects custom schemes directly in Account Link URLs (`url_invalid`), so do not set
 * `STRIPE_MOBILE_CONNECT_ONBOARDING_RETURN_URL` or `_REFRESH_URL` to `servicelinkmobile://...`.
 *
 * Override: `EXPO_PUBLIC_STRIPE_CONNECT_ONBOARDING_AUTH_RETURN_URL`.
 */
export const STRIPE_CONNECT_ONBOARDING_AUTH_RETURN_URL =
  String(process.env.EXPO_PUBLIC_STRIPE_CONNECT_ONBOARDING_AUTH_RETURN_URL ?? '').trim() ||
  'servicelinkmobile://payments/connect';
