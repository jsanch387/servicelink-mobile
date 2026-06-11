import { productionWebApiHttpsGuard } from '../../../lib/productionWebApiHttpsGuard';
import { resolveStripeMobileCheckoutOrigin } from '../../../lib/stripeMobileCheckoutOrigin';

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
 * Parses the `Retry-After` header (seconds) returned with a 429.
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
 * Maps the server contract's status codes to a user-facing English message.
 *
 * @param {number} httpStatus
 * @param {string | null} serverMessage
 * @returns {string}
 */
export function mapOnMyWayHttpError(httpStatus, serverMessage) {
  const fallback = serverMessage?.trim() || null;
  switch (httpStatus) {
    case 400:
      return fallback || 'Something went wrong. Please try again.';
    case 401:
      return 'Sign in again to text the customer.';
    case 404:
      return fallback || 'Appointment not found.';
    case 409:
      return fallback || 'This action is not available for this appointment.';
    case 422:
      return fallback || 'No valid phone number on file for this customer.';
    case 429:
      return fallback || 'You’re sending texts too quickly. Try again shortly.';
    case 502:
      return fallback || 'The text couldn’t be delivered. Try again.';
    case 503:
      return fallback || 'Texting is temporarily unavailable. Try again later.';
    case 500:
      return fallback || 'Something went wrong on the server. Try again in a moment.';
    case 0:
      return fallback || 'Network error. Check your connection and try again.';
    default:
      return fallback || `Couldn’t send the text (${httpStatus}).`;
  }
}

/**
 * Asks the server to text the customer "{Business} is on the way" for a confirmed booking.
 * The server holds the Pingram key, enforces ownership + rate limits, and owns the template.
 *
 * @param {string | null | undefined} accessToken Supabase session access token.
 * @param {string} bookingId `bookings.id` UUID.
 * @returns {Promise<
 *   | { ok: true; requestId?: string }
 *   | { ok: false; error: Error; httpStatus: number; retryAfterSec?: number; requestId?: string }
 * >}
 */
export async function postOnMyWayForBooking(accessToken, bookingId) {
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

  let res;
  try {
    res = await fetch(`${origin}/api/availability/bookings/${encodedId}/on-my-way`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
      },
      body: '{}',
    });
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
  const onMyWaySentAt =
    typeof payload?.onMyWaySentAt === 'string'
      ? payload.onMyWaySentAt
      : typeof payload?.on_my_way_sent_at === 'string'
        ? payload.on_my_way_sent_at
        : undefined;

  if (res.ok && payload?.success === true) {
    return { ok: true, requestId: echoedRequestId, onMyWaySentAt };
  }

  return {
    ok: false,
    error: new Error(mapOnMyWayHttpError(res.status, serverMessage)),
    httpStatus: res.status,
    retryAfterSec: readRetryAfterSeconds(res.headers),
    requestId: echoedRequestId,
  };
}
