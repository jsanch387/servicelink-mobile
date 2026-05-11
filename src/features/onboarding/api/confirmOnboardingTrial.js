import {
  assertStripeCheckoutOriginAllowed,
  resolveStripeMobileCheckoutOrigin,
} from '../../../lib/stripeMobileCheckoutOrigin';

/**
 * POST `/api/stripe/confirm-onboarding-trial` — sync profile after Checkout or poll DB + Stripe.
 * Server contract: `docs/nextjs-onboarding-trial-contract.md`.
 *
 * @param {string | null | undefined} accessToken
 * @param {{ checkout_session_id?: string | null }} [params]
 */
export async function confirmOnboardingTrial(accessToken, params = {}) {
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

  const checkout_session_id =
    typeof params.checkout_session_id === 'string' && params.checkout_session_id.trim()
      ? params.checkout_session_id.trim()
      : undefined;
  const payload = checkout_session_id ? { checkout_session_id } : {};

  let res;
  try {
    res = await fetch(`${origin}/api/stripe/confirm-onboarding-trial`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
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

  if (body?.success === true) {
    return {
      ok: true,
      trial_confirmation:
        body.trial_confirmation != null && typeof body.trial_confirmation === 'object'
          ? body.trial_confirmation
          : null,
      synced_from_checkout: body?.synced_from_checkout === true,
      checkout_pending: body?.checkout_pending === true,
      checkout_session_status:
        typeof body?.checkout_session_status === 'string' ? body.checkout_session_status : null,
    };
  }

  return {
    error: new Error(serverError || 'Invalid response'),
    httpStatus: res.status,
  };
}
