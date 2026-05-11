import {
  assertStripeCheckoutOriginAllowed,
  resolveStripeMobileCheckoutOrigin,
} from '../../../lib/stripeMobileCheckoutOrigin';

/**
 * POST `/api/stripe/start-onboarding-trial` — silent onboarding trial (no Checkout).
 * Server contract: `docs/nextjs-onboarding-trial-contract.md`.
 *
 * @param {string | null | undefined} accessToken
 * @returns {Promise<
 *   | {
 *       ok: true;
 *       trial_confirmation?: Record<string, unknown> | null;
 *       alreadyActive?: boolean;
 *       fallbackToCheckout?: boolean;
 *     }
 *   | { error: Error; httpStatus: number }
 * >}
 */
export async function startOnboardingTrial(accessToken) {
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
    res = await fetch(`${origin}/api/stripe/start-onboarding-trial`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
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
      alreadyActive: body?.alreadyActive === true,
      fallbackToCheckout: body?.fallbackToCheckout === true,
    };
  }

  return {
    error: new Error(serverError || 'Invalid response'),
    httpStatus: res.status,
  };
}
