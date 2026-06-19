import { productionWebApiHttpsGuard } from '../../../lib/productionWebApiHttpsGuard';
import { resolveStripeMobileCheckoutOrigin } from '../../../lib/stripeMobileCheckoutOrigin';
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

  let res;
  try {
    res = await fetch(
      `${origin}/api/availability/bookings/${encodedId}/tap-to-pay/${routeSuffix}`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Request-ID': requestId,
        },
        body: hasBody ? JSON.stringify(body) : '{}',
      },
    );
  } catch (err) {
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
    return { ok: true, payload, requestId: echoedRequestId };
  }

  return {
    ok: false,
    error: new Error(mapTapToPayHttpError(res.status, serverMessage)),
    httpStatus: res.status,
    retryAfterSec: readRetryAfterSeconds(res.headers),
    requestId: echoedRequestId,
  };
}
