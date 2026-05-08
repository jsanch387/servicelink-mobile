import {
  assertStripeCheckoutOriginAllowed,
  resolveStripeMobileCheckoutOrigin,
} from '../../../lib/stripeMobileCheckoutOrigin';

/**
 * Paywall upgrade — Stripe Checkout (post-onboarding).
 *
 * **Endpoint:** `POST /api/stripe/create-checkout-session` (same path as onboarding; different body).
 *
 * **Auth:** `Authorization: Bearer <Supabase access_token>`
 *
 * **Body (JSON):** `{ "client": "mobile" }` only — do **not** send `onboarding_trial_bridge`
 * (that flow uses trial + onboarding completion in the webhook).
 *
 * **Server env (upgrade):** `STRIPE_MOBILE_UPGRADE_SUCCESS_URL` and `STRIPE_MOBILE_UPGRADE_CANCEL_URL`
 * must be set when `client: mobile` for this non-onboarding checkout (see web
 * `mobile-upgrade-stripe-checkout.md`).
 *
 * **After checkout:** refetch profile / subscription from the app; do not trust only the deep-link
 * query for entitlements (webhook updates `profiles`).
 *
 * @param {string | null | undefined} accessToken - Supabase `session.access_token`
 * @returns {Promise<{ url: string } | { error: Error; httpStatus: number }>}
 */
export async function createPaywallUpgradeCheckoutSession(accessToken) {
  const origin = resolveStripeMobileCheckoutOrigin();
  if (!origin) {
    return { error: new Error('EXPO_PUBLIC_WEB_APP_URL is not set'), httpStatus: 0 };
  }
  if (!accessToken) {
    return { error: new Error('Not signed in'), httpStatus: 0 };
  }
  try {
    assertStripeCheckoutOriginAllowed(origin);
  } catch (error) {
    return {
      error: error instanceof Error ? error : new Error('Invalid web origin'),
      httpStatus: 0,
    };
  }

  let res;
  try {
    res = await fetch(`${origin}/api/stripe/create-checkout-session`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ client: 'mobile' }),
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error : new Error('Network request failed'),
      httpStatus: 0,
    };
  }

  let body = {};
  try {
    body = await res.json();
  } catch {
    body = {};
  }

  const serverError =
    typeof body?.error === 'string'
      ? body.error
      : typeof body?.message === 'string'
        ? body.message
        : null;

  const failed = !res.ok || body?.success === false;
  if (failed) {
    const msg = serverError || `Request failed (${res.status})`;
    return { error: new Error(msg), httpStatus: res.status };
  }

  if (body?.success === true && typeof body?.url === 'string' && body.url.length > 0) {
    return { url: body.url };
  }

  return {
    error: new Error(serverError || 'Invalid response'),
    httpStatus: res.status,
  };
}
