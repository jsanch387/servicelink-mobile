/**
 * Base URL for the Next.js app that serves **`/api/*`** (same origin as the logged-in dashboard if
 * marketing is on another domain). Set `EXPO_PUBLIC_WEB_APP_URL` in `.env` (no trailing slash).
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/route-handlers
 */

function getWebAppOrigin() {
  const raw = process.env.EXPO_PUBLIC_WEB_APP_URL ?? '';
  return String(raw).trim().replace(/\/$/, '');
}

/**
 * POST `{origin}/api/stripe/connect/express-dashboard` — short-lived Express Dashboard URL.
 *
 * **Auth (web repo today):** the route uses **Supabase cookie session only** (`createServerClient`
 * + `cookies()`). It does **not** read `Authorization: Bearer` yet. We still send Bearer so the
 * server can opt in later without an app update. Until then, expect **401** from this call from
 * mobile; use the web dashboard to open Stripe, or add Bearer JWT verification on that route.
 *
 * **Responses** (from web): success `{ success: true, url }`; errors JSON `{ success: false, error }`
 * with 401 / 403 / 404 / 500 / 502 as documented on the server.
 *
 * @param {string | null | undefined} accessToken - `session.access_token` (for future Bearer support)
 * @returns {Promise<{ url: string } | { error: Error; httpStatus: number }>}
 */
export async function fetchStripeExpressDashboardUrl(accessToken) {
  const origin = getWebAppOrigin();
  if (!origin) {
    return { error: new Error('EXPO_PUBLIC_WEB_APP_URL is not set'), httpStatus: 0 };
  }
  if (!accessToken) {
    return { error: new Error('Not signed in'), httpStatus: 0 };
  }

  const res = await fetch(`${origin}/api/stripe/connect/express-dashboard`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

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
