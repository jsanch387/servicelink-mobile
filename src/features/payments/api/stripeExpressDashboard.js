import {
  assertStripeCheckoutOriginAllowed,
  resolveStripeMobileCheckoutOrigin,
} from '../../../lib/stripeMobileCheckoutOrigin';

/**
 * Stripe Connect **Express Dashboard** (Login Link) for the current business’s connected account.
 *
 * **Request:** `POST /api/stripe/connect/express-dashboard` with `Authorization: Bearer <supabase_access_token>`,
 * `Content-Type: application/json`, body `{ "client": "mobile" }` (optional on server; we send it for parity).
 *
 * **Response:** `{ success: true, url }` — open `url` with `WebBrowser.openBrowserAsync` (no `return_url` on Login Links).
 *
 * **Errors:** 404 when no `stripe_account_id`; 401/403 when not allowed.
 *
 * @param {string | null | undefined} accessToken
 * @returns {Promise<{ url: string } | { error: Error; httpStatus: number }>}
 */
export async function fetchStripeExpressDashboardUrl(accessToken) {
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
    res = await fetch(`${origin}/api/stripe/connect/express-dashboard`, {
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
