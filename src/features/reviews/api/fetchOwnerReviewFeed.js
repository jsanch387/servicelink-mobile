import { productionWebApiHttpsGuard } from '../../../lib/productionWebApiHttpsGuard';
import { resolveStripeMobileCheckoutOrigin } from '../../../lib/stripeMobileCheckoutOrigin';
import { API_ROUTES } from '../constants/reviewsApiRoutes';
import { mapDashboardSummary } from '../utils/buildReviewsSummary';

/**
 * @param {number} httpStatus
 * @param {string | null} serverMessage
 */
function mapReviewsInboxError(httpStatus, serverMessage) {
  const message = serverMessage?.trim() || '';
  if (httpStatus === 401) return message || 'Sign in again to view reviews.';
  if (httpStatus === 0) return message || 'Network error. Check your connection and try again.';
  return message || 'Could not load reviews.';
}

/**
 * One page of the merged inbox. The server page size is fixed; pass `offset` for the next page.
 *
 * @param {string | null | undefined} accessToken
 * @param {number} [offset]
 * @returns {Promise<
 *   | { ok: true; reviews: Record<string, unknown>[]; hasMore: boolean; summary: { averageRating: number; totalCount: number; breakdown: { stars: number; percent: number }[] } }
 *   | { ok: false; error: Error; httpStatus: number; userMessage: string }
 * >}
 */
export async function fetchOwnerReviewPage(accessToken, offset = 0) {
  const origin = resolveStripeMobileCheckoutOrigin();
  const httpsErr = productionWebApiHttpsGuard(origin);
  if (httpsErr) {
    return {
      ok: false,
      error: httpsErr,
      httpStatus: 0,
      userMessage: mapReviewsInboxError(0, null),
    };
  }

  const token = String(accessToken ?? '').trim();
  if (!token) {
    return {
      ok: false,
      error: new Error('Not signed in'),
      httpStatus: 401,
      userMessage: mapReviewsInboxError(401, null),
    };
  }

  const params = new URLSearchParams({ offset: String(offset) });
  let res;
  try {
    res = await fetch(`${origin}${API_ROUTES.REVIEWS}?${params.toString()}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Network request failed');
    return { ok: false, error, httpStatus: 0, userMessage: mapReviewsInboxError(0, null) };
  }

  let payload = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  const serverMessage =
    payload && typeof payload === 'object' && typeof payload.error === 'string'
      ? payload.error.trim()
      : null;

  if (!res.ok || !payload || payload.success !== true || !Array.isArray(payload.reviews)) {
    return {
      ok: false,
      error: new Error(serverMessage || 'Could not load reviews.'),
      httpStatus: res.status,
      userMessage: mapReviewsInboxError(res.status, serverMessage),
    };
  }

  return {
    ok: true,
    reviews: payload.reviews,
    hasMore: payload.hasMore === true && payload.reviews.length > 0,
    summary: mapDashboardSummary(payload.summary),
  };
}
