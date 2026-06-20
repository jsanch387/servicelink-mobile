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
 * @param {Headers} headers
 * @returns {string | undefined}
 */
function readRequestIdHeader(headers) {
  return (
    (
      headers.get('X-Request-ID') ??
      headers.get('x-request-id') ??
      headers.get('X-Correlation-ID') ??
      headers.get('x-correlation-id') ??
      undefined
    )?.trim() || undefined
  );
}

/**
 * @param {Headers} headers
 * @returns {number | undefined}
 */
function readRetryAfterSeconds(headers) {
  const raw = headers.get('Retry-After') ?? headers.get('retry-after');
  if (!raw) {
    return undefined;
  }
  const seconds = Number(raw);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds : undefined;
}

/**
 * @param {string | null | undefined} accessToken
 * @param {string} bookingId
 * @param {'connection-token' | 'intent'} routeSuffix
 * @param {Record<string, unknown> | undefined} [body]
 * @returns {Promise<
 *   | { ok: true; payload: Record<string, unknown>; requestId?: string }
 *   | { ok: false; error: Error; httpStatus: number; retryAfterSec?: number; requestId?: string }
 * >}
 */
export async function tapToPayRequest(accessToken, bookingId, routeSuffix, body) {
  const origin = resolveStripeMobileCheckoutOrigin();
  const httpsErr = productionWebApiHttpsGuard(origin);
  if (httpsErr) {
    return { ok: false, error: httpsErr, httpStatus: 0 };
  }
  if (!accessToken) {
    return { ok: false, error: new Error('Not signed in'), httpStatus: 0 };
  }
  if (!bookingId?.trim()) {
    return { ok: false, error: new Error('Missing booking id'), httpStatus: 0 };
  }

  const requestId = createRequestId();
  const encodedId = encodeURIComponent(bookingId.trim());
  const hasBody = body !== undefined;
  const url = `${origin}/api/availability/bookings/${encodedId}/tap-to-pay/${routeSuffix}`;

  logTapToPayDebug('api.request', {
    route: routeSuffix,
    origin,
    bookingId: maskId(bookingId),
    requestId,
    hasBody,
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
      body: hasBody ? JSON.stringify(body) : '{}',
    });
  } catch (err) {
    logTapToPayFailure(routeSuffix, {
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

  const echoedRequestId = readRequestIdHeader(res.headers) ?? requestId;
  let payload = {};
  try {
    payload = await res.json();
  } catch {
    payload = {};
  }

  const serverMessage = typeof payload?.error === 'string' ? payload.error : null;

  if (res.ok && payload?.success === true) {
    logTapToPayDebug('api.success', {
      route: routeSuffix,
      httpStatus: res.status,
      requestId: echoedRequestId,
      paymentIntentId: maskId(payload?.paymentIntentId),
      amountCents: payload?.amountCents,
      terminalLocationId: maskId(
        payload?.terminalLocationId ?? payload?.locationId ?? payload?.stripeTerminalLocationId,
      ),
      stripeAccountId: maskId(payload?.stripeAccountId ?? payload?.onBehalfOf),
    });
    return { ok: true, payload, requestId: echoedRequestId };
  }

  const mappedError = mapTapToPayHttpError(res.status, serverMessage);
  logTapToPayFailure(routeSuffix, {
    message: serverMessage ?? mappedError,
    httpStatus: res.status,
    requestId: echoedRequestId,
    url,
  });

  return {
    ok: false,
    error: new Error(mappedError),
    httpStatus: res.status,
    retryAfterSec: readRetryAfterSeconds(res.headers),
    requestId: echoedRequestId,
  };
}
