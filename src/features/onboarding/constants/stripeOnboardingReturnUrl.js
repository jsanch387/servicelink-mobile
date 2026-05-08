/**
 * Prefix passed to `WebBrowser.openAuthSessionAsync` as `redirectUrl`. Expo resolves the auth
 * session when the app receives a deep link where `event.url.startsWith(redirectUrl)` — so Stripe
 * `success_url` / `cancel_url` must both use URLs that start with this value (query strings OK).
 *
 * Web: set `STRIPE_MOBILE_ONBOARDING_SUCCESS_URL` and `STRIPE_MOBILE_ONBOARDING_CANCEL_URL` to
 * values with this prefix, e.g. `${prefix}?result=success` and `${prefix}?result=cancel`.
 *
 * Override for local experiments: `EXPO_PUBLIC_STRIPE_ONBOARDING_AUTH_RETURN_URL`.
 */
export const STRIPE_ONBOARDING_CHECKOUT_AUTH_RETURN_URL =
  String(process.env.EXPO_PUBLIC_STRIPE_ONBOARDING_AUTH_RETURN_URL ?? '').trim() ||
  'servicelinkmobile://onboarding/stripe';
