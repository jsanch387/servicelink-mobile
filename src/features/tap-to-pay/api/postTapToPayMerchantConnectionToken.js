import { productionWebApiHttpsGuard } from '../../../lib/productionWebApiHttpsGuard';
import { resolveStripeMobileCheckoutOrigin } from '../../../lib/stripeMobileCheckoutOrigin';
import { logTapToPayDebug, logTapToPayFailure, maskId } from '../utils/logTapToPayDebug';
import { mapTapToPayHttpError } from '../utils/mapTapToPayHttpError';

function createRequestId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `mobile-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Merchant-scoped Terminal connection token for app warm-up (no booking).
 *
 * Server: `POST /api/payments/tap-to-pay/connection-token` with optional
 * `{ stripeAccountId }` in the body; token must be created on the connected account.
 *
 * @param {string | null | undefined} accessToken
 * @param {{ stripeAccountId?: string | null }} [options]
 * @returns {Promise<
 *   | { ok: true; secret: string; requestId?: string }
 *   | { ok: false; error: Error; httpStatus: number; requestId?: string }
 * >}
 */
export async function postTapToPayMerchantConnectionToken(accessToken, options = {}) {
  const origin = resolveStripeMobileCheckoutOrigin();
  const httpsErr = productionWebApiHttpsGuard(origin);
  if (httpsErr) {
    return { ok: false, error: httpsErr, httpStatus: 0 };
  }
  if (!accessToken) {
    return { ok: false, error: new Error('Not signed in'), httpStatus: 0 };
  }

  const stripeAccountId =
    typeof options.stripeAccountId === 'string' ? options.stripeAccountId.trim() : '';
  const body = stripeAccountId ? { stripeAccountId } : {};
  const requestId = createRequestId();
  const url = `${origin}/api/payments/tap-to-pay/connection-token`;

  logTapToPayDebug('api.request', {
    route: 'merchant-connection-token',
    origin,
    stripeAccountId: maskId(stripeAccountId),
    requestId,
  });

  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    logTapToPayFailure('merchant-connection-token', {
      message: err instanceof Error ? err.message : 'Network request failed',
      httpStatus: 0,
      requestId,
      url,
    });
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

  const serverMessage = typeof payload?.error === 'string' ? payload.error : null;

  if (res.ok && payload?.success === true) {
    const secret = typeof payload?.secret === 'string' ? payload.secret.trim() : '';
    if (!secret) {
      return {
        ok: false,
        error: new Error('Couldn’t connect to payments. Try again or mark as paid.'),
        httpStatus: 500,
        requestId: echoedRequestId,
      };
    }
    logTapToPayDebug('api.success', {
      route: 'merchant-connection-token',
      httpStatus: res.status,
      requestId: echoedRequestId,
      stripeAccountId: maskId(stripeAccountId),
    });
    return { ok: true, secret, requestId: echoedRequestId };
  }

  const mappedError = mapTapToPayHttpError(res.status, serverMessage, 'merchant');
  logTapToPayFailure('merchant-connection-token', {
    message: serverMessage ?? mappedError,
    httpStatus: res.status,
    requestId: echoedRequestId,
    url,
  });

  return {
    ok: false,
    error: new Error(mappedError),
    httpStatus: res.status,
    requestId: echoedRequestId,
  };
}
