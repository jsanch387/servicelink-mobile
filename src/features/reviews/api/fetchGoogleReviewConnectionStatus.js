import { productionWebApiHttpsGuard } from '../../../lib/productionWebApiHttpsGuard';
import { resolveStripeMobileCheckoutOrigin } from '../../../lib/stripeMobileCheckoutOrigin';
import { API_ROUTES } from '../constants/reviewsApiRoutes';

/**
 * @param {unknown} payload
 * @returns {{ connected: boolean; locationTitle: string | null; lastSyncedAt: string | null } | null}
 */
export function parseGoogleReviewConnectionStatus(payload) {
  if (!payload || typeof payload !== 'object' || payload.success !== true) {
    return null;
  }

  const record = /** @type {Record<string, unknown>} */ (payload);
  return {
    connected: record.connected === true,
    locationTitle: typeof record.locationTitle === 'string' ? record.locationTitle : null,
    lastSyncedAt: typeof record.lastSyncedAt === 'string' ? record.lastSyncedAt : null,
  };
}

/**
 * Owner Google connection. Does not start OAuth and does not read Google tables.
 *
 * @param {string | null | undefined} accessToken
 * @returns {Promise<
 *   | { ok: true; status: { connected: boolean; locationTitle: string | null; lastSyncedAt: string | null }; httpStatus: number }
 *   | { ok: false; error: Error; httpStatus: number }
 * >}
 */
export async function fetchGoogleReviewConnectionStatus(accessToken) {
  const origin = resolveStripeMobileCheckoutOrigin();
  const httpsErr = productionWebApiHttpsGuard(origin);
  if (httpsErr) {
    return { ok: false, error: httpsErr, httpStatus: 0 };
  }

  const token = String(accessToken ?? '').trim();
  if (!token) {
    return {
      ok: false,
      error: new Error('Sign in again to load Google reviews.'),
      httpStatus: 401,
    };
  }

  let res;
  try {
    res = await fetch(`${origin}${API_ROUTES.REVIEWS_GOOGLE_STATUS}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err : new Error('Network request failed'),
      httpStatus: 0,
    };
  }

  let payload = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok) {
    const message =
      payload &&
      typeof payload === 'object' &&
      typeof payload.error === 'string' &&
      payload.error.trim()
        ? payload.error.trim()
        : 'Could not load Google connection.';
    return { ok: false, error: new Error(message), httpStatus: res.status };
  }

  const status = parseGoogleReviewConnectionStatus(payload);
  if (!status) {
    return {
      ok: false,
      error: new Error('Could not load Google connection.'),
      httpStatus: res.status,
    };
  }

  return { ok: true, status, httpStatus: res.status };
}
