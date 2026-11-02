import { productionWebApiHttpsGuard } from '../../../lib/productionWebApiHttpsGuard';
import { resolveStripeMobileCheckoutOrigin } from '../../../lib/stripeMobileCheckoutOrigin';
import { API_ROUTES } from '../constants/reviewsApiRoutes';

/**
 * @param {number} httpStatus
 * @param {string | null} serverMessage
 */
export function mapGoogleReviewConnectError(httpStatus, serverMessage) {
  const message = serverMessage?.trim() || '';
  if (httpStatus === 401) return message || 'Sign in again to connect Google.';
  if (httpStatus === 403) return message || 'Google reviews are not available yet.';
  if (httpStatus === 500) return message || 'Google Business is not configured.';
  if (httpStatus === 0) return message || 'Network error. Check your connection and try again.';
  return message || 'Could not start Google connect.';
}

/**
 * Start Google Business connect. The server imports reviews on the way back.
 * Do not change the returned URL, and do not call the callback from the app.
 *
 * @param {string | null | undefined} accessToken
 * @returns {Promise<
 *   | { ok: true; url: string }
 *   | { ok: false; error: Error; httpStatus: number; userMessage: string }
 * >}
 */
export async function postGoogleReviewConnect(accessToken) {
  const origin = resolveStripeMobileCheckoutOrigin();
  const httpsErr = productionWebApiHttpsGuard(origin);
  if (httpsErr) {
    return {
      ok: false,
      error: httpsErr,
      httpStatus: 0,
      userMessage: mapGoogleReviewConnectError(0, httpsErr.message),
    };
  }

  const token = String(accessToken ?? '').trim();
  if (!token) {
    return {
      ok: false,
      error: new Error('Not signed in'),
      httpStatus: 401,
      userMessage: mapGoogleReviewConnectError(401, null),
    };
  }

  let res;
  try {
    res = await fetch(`${origin}${API_ROUTES.REVIEWS_GOOGLE_CONNECT}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ client: 'mobile' }),
    });
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Network request failed');
    return {
      ok: false,
      error,
      httpStatus: 0,
      userMessage: mapGoogleReviewConnectError(0, null),
    };
  }

  let payload = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  const serverMessage =
    payload &&
    typeof payload === 'object' &&
    typeof payload.error === 'string' &&
    payload.error.trim()
      ? payload.error.trim()
      : null;

  if (!res.ok || !payload || payload.success !== true || typeof payload.url !== 'string') {
    return {
      ok: false,
      error: new Error(serverMessage || 'Could not start Google connect.'),
      httpStatus: res.status,
      userMessage: mapGoogleReviewConnectError(res.status, serverMessage),
    };
  }

  return { ok: true, url: payload.url };
}
