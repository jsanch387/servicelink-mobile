import { productionWebApiHttpsGuard } from '../../../../lib/productionWebApiHttpsGuard';
import { resolveStripeMobileCheckoutOrigin } from '../../../../lib/stripeMobileCheckoutOrigin';
import { parseBookingSmsOutcome } from '../../utils/parseBookingSmsOutcome';

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
 * @param {number} httpStatus
 * @param {string | null} serverMessage
 * @returns {string}
 */
export function mapOwnerManualBookingHttpError(httpStatus, serverMessage) {
  const fallback = serverMessage?.trim() || null;
  if (httpStatus === 401) {
    return 'Sign in again to create this booking.';
  }
  if (httpStatus === 403) {
    return (
      fallback ||
      "You can't create this booking for this business, or the free booking limit was reached."
    );
  }
  if (httpStatus === 404) {
    return fallback || 'This business is not available for booking right now.';
  }
  if (httpStatus === 409) {
    return fallback || 'That time conflicts with time off. Pick another slot.';
  }
  if (httpStatus === 400) {
    return fallback || 'Check the details and try again.';
  }
  if (httpStatus === 500) {
    return fallback || 'Something went wrong on the server. Try again in a moment.';
  }
  if (httpStatus === 0) {
    return fallback || 'Network error. Check your connection and try again.';
  }
  return fallback || `Could not create booking (${httpStatus}).`;
}

/**
 * Owner manual booking: `POST /api/public/bookings` with `ownerManualBooking: true` and Bearer JWT.
 * Runs the same server pipeline as web (`/[slug]/book?for=owner`) — emails, `booking_payments`, caps, time-off.
 *
 * @param {string | null | undefined} accessToken - Supabase `session.access_token`
 * @param {Record<string, unknown>} body - {@link buildOwnerManualPublicBookingBody}
 * @returns {Promise<
 *   | { ok: true; data: { id: string }; requestId?: string }
 *   | { ok: false; error: Error; httpStatus: number; requestId?: string }
 * >}
 */
export async function postOwnerManualPublicBooking(accessToken, body) {
  const origin = resolveStripeMobileCheckoutOrigin();
  const httpsErr = productionWebApiHttpsGuard(origin);
  if (httpsErr) {
    return { ok: false, error: httpsErr, httpStatus: 0 };
  }
  if (!accessToken) {
    return { ok: false, error: new Error('Not signed in'), httpStatus: 0 };
  }

  const requestId = createRequestId();

  let res;
  try {
    res = await fetch(`${origin}/api/public/bookings`, {
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
    return {
      ok: false,
      error: err instanceof Error ? err : new Error('Network request failed'),
      httpStatus: 0,
    };
  }

  const echoedRequestId = readRequestIdHeader(res.headers) ?? requestId;

  let parsed = {};
  try {
    parsed = await res.json();
  } catch {
    parsed = {};
  }

  const serverMessage =
    typeof parsed?.error === 'string'
      ? parsed.error
      : typeof parsed?.message === 'string'
        ? parsed.message
        : null;

  const dataObj = parsed?.data && typeof parsed.data === 'object' ? parsed.data : null;
  const id = dataObj && typeof dataObj.id === 'string' ? dataObj.id.trim() : '';

  if (res.status === 201 && parsed?.success === true && id) {
    const smsOutcome = parseBookingSmsOutcome(parsed);

    return { ok: true, data: { id, smsOutcome }, requestId: echoedRequestId };
  }

  const msg = mapOwnerManualBookingHttpError(res.status, serverMessage);
  return {
    ok: false,
    error: new Error(msg),
    httpStatus: res.status,
    requestId: echoedRequestId,
  };
}
