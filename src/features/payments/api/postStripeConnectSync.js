import {
  assertStripeCheckoutOriginAllowed,
  resolveStripeMobileCheckoutOrigin,
} from '../../../lib/stripeMobileCheckoutOrigin';

/**
 * Refresh `payment_accounts` from Stripe after Connect redirect (mobile).
 *
 * POST `/api/stripe/connect/sync` with `{}`.
 *
 * @param {string | null | undefined} accessToken
 * @returns {Promise<{ synced: boolean; skipped?: boolean; reason?: string } | { error: Error; httpStatus: number }>}
 */
export async function postStripeConnectSync(accessToken) {
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
    res = await fetch(`${origin}/api/stripe/connect/sync`, {
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
      synced: body.synced === true,
      skipped: body.skipped === true,
      reason: typeof body.reason === 'string' ? body.reason : undefined,
    };
  }

  return {
    error: new Error(serverError || 'Invalid response'),
    httpStatus: res.status,
  };
}
