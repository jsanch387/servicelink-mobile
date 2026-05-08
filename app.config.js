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
