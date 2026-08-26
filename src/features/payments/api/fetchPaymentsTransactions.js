import { productionWebApiHttpsGuard } from '../../../lib/productionWebApiHttpsGuard';
import { resolveStripeMobileCheckoutOrigin } from '../../../lib/stripeMobileCheckoutOrigin';
import { API_ROUTES } from '../constants/paymentsApiRoutes';
import { PAYMENTS_TRANSACTIONS_PAGE_SIZE } from '../constants/paymentsTransactions';
import {
  clampPaymentsTransactionsLimit,
  parsePaymentsTransactionsPage,
} from '../utils/parsePaymentsTransactions';

function createRequestId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `mobile-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * @param {number} httpStatus
 * @param {string} serverMessage
 */
export function mapPaymentsTransactionsHttpError(httpStatus, serverMessage) {
  const fallback = serverMessage.trim();
  switch (httpStatus) {
    case 401:
      return fallback || 'Sign in again to view transactions.';
    case 403:
      return fallback || 'Upgrade to Pro to view transactions.';
    case 400:
      return fallback || 'Couldn’t load transactions.';
    case 404:
      return fallback || 'Business profile not found';
    case 429:
      return fallback || 'Too many requests. Please wait a moment and try again.';
    case 0:
      return fallback || 'Network error. Check your connection and try again.';
    default:
      return fallback || "Couldn't load transactions. Try again.";
  }
}

/**
 * Owner activity feed: Stripe charges + offline collections.
 * Server: `GET /api/payments/transactions`
 *
 * @param {string | null | undefined} accessToken
 * @param {{ limit?: number; startingAfter?: string | null }} [options]
 * @returns {Promise<
 *   | { ok: true; page: import('../constants/paymentsTransactions').PaymentsTransactionsPage; requestId?: string }
 *   | { ok: false; error: Error; httpStatus: number; requestId?: string }
 * >}
 */
export async function fetchPaymentsTransactions(accessToken, options = {}) {
  const origin = resolveStripeMobileCheckoutOrigin();
  const httpsErr = productionWebApiHttpsGuard(origin);
  if (httpsErr) {
    return { ok: false, error: httpsErr, httpStatus: 0 };
  }
  const token = String(accessToken ?? '').trim();
  if (!token) {
    return {
      ok: false,
      error: new Error('Sign in again to view transactions.'),
      httpStatus: 401,
    };
  }

  const limit = clampPaymentsTransactionsLimit(options.limit ?? PAYMENTS_TRANSACTIONS_PAGE_SIZE);
  const startingAfter = String(options.startingAfter ?? '').trim();
  const params = new URLSearchParams({ limit: String(limit) });
  if (startingAfter) {
    params.set('startingAfter', startingAfter);
  }

  const requestId = createRequestId();
  const url = `${origin}${API_ROUTES.PAYMENTS_TRANSACTIONS}?${params.toString()}`;

  let res;
  try {
    res = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'X-Request-ID': requestId,
      },
    });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err : new Error('Network request failed'),
      httpStatus: 0,
    };
  }

  const echoedRequestId =
    (res.headers.get('X-Request-ID') ?? res.headers.get('x-request-id'))?.trim() || requestId;

  let payload = {};
  try {
    payload = await res.json();
  } catch {
    payload = {};
  }

  const serverMessage = typeof payload?.error === 'string' ? payload.error.trim() : '';

  const looksLikePage = Array.isArray(payload?.items) || Boolean(payload?.balance);
  if (res.ok && (payload?.success === true || payload?.success === 'true' || looksLikePage)) {
    return {
      ok: true,
      page: parsePaymentsTransactionsPage(payload),
      requestId: echoedRequestId,
    };
  }

  return {
    ok: false,
    error: new Error(mapPaymentsTransactionsHttpError(res.status, serverMessage)),
    httpStatus: res.status,
    requestId: echoedRequestId,
  };
}
