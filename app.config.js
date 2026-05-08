/**
 * Loaded by Expo CLI when resolving config.
 *
 * Important: mutating `process.env` here does not reliably inline into the JS
 * bundle for `process.env.EXPO_PUBLIC_*`. We also put the resolved origin in
 * `extra.webAppUrl` so runtime code can read it via `expo-constants`.
 *
 * Override locally with `.env` / `.env.local`:
 * EXPO_PUBLIC_WEB_APP_URL=http://localhost:3000
 *
 * Optional — must match prefix of Stripe mobile onboarding return URLs on the server:
 * EXPO_PUBLIC_STRIPE_ONBOARDING_AUTH_RETURN_URL=servicelinkmobile://onboarding/stripe
 *
 * Optional — paywall upgrade checkout (`STRIPE_MOBILE_UPGRADE_*` on server):
 * EXPO_PUBLIC_STRIPE_PAYWALL_CHECKOUT_AUTH_RETURN_URL=servicelinkmobile://paywall/stripe
 *
 * Optional — Stripe Connect onboarding redirect prefix used by app auth session:
 * EXPO_PUBLIC_STRIPE_CONNECT_ONBOARDING_AUTH_RETURN_URL=servicelinkmobile://payments/connect
 *
 * Server contract v2 (`STRIPE_MOBILE_CONNECT_ONBOARDING_*`):
 * - `STRIPE_MOBILE_CONNECT_ONBOARDING_RETURN_URL` and `_REFRESH_URL` should be HTTPS bridge URLs,
 *   e.g. `https://<domain>/mobile-bridge/connect-return` and
 *   `https://<domain>/mobile-bridge/connect-refresh`.
 * - Bridge pages open app deep links (optional server envs):
 *   `STRIPE_MOBILE_CONNECT_DEEP_LINK_RETURN_URL` (default
 *   `servicelinkmobile://payments/connect?connect=return`)
 *   `STRIPE_MOBILE_CONNECT_DEEP_LINK_REFRESH_URL` (default
 *   `servicelinkmobile://payments/connect?connect=refresh`)
 */
const DEFAULT_WEB_APP_URL = 'https://myservicelink.app';

const envWebRaw =
  String(process.env.EXPO_PUBLIC_WEB_APP_URL ?? '').trim() ||
  String(process.env.EXPO_PUBLIC_SITE_URL ?? '').trim();
const resolvedWebAppUrl = envWebRaw.replace(/\/$/, '') || DEFAULT_WEB_APP_URL;

// Still set for tooling/scripts that read env during `expo start`.
if (!envWebRaw) {
  process.env.EXPO_PUBLIC_WEB_APP_URL = DEFAULT_WEB_APP_URL;
}

module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...(config.extra ?? {}),
    webAppUrl: resolvedWebAppUrl,
  },
});
