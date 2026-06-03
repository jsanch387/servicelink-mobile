import { productionWebApiHttpsGuard } from '../../../../lib/productionWebApiHttpsGuard';
import { resolveStripeMobileCheckoutOrigin } from '../../../../lib/stripeMobileCheckoutOrigin';

/**
 * @typedef {'no_customer_email' | 'no_customer_id' | 'invite_already_exists' | 'customer_already_reviewed' | 'pending_invite_exists'} ReviewInviteSkipReason
 */

/**
 * @typedef {(
 *   | { success: true; sent: true; skipped: false; inviteId: string }
 *   | { success: true; sent: false; skipped: true; reason: ReviewInviteSkipReason }
 *   | { success: true; sent: false; skipped: false; inviteId: string }
 * )} ReviewInviteSuccessResponse
 */

/** @typedef {{ success: false; error: string }} ReviewInviteErrorResponse */

/** @typedef {ReviewInviteSuccessResponse | ReviewInviteErrorResponse} ReviewInviteResponse */

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
export function mapReviewInviteHttpError(httpStatus, serverMessage) {
  const fallback = serverMessage?.trim() || null;
  if (httpStatus === 401) {
    return 'Sign in again to send the review invite.';
  }
  if (httpStatus === 404) {
    return fallback || 'Booking not found.';
  }
  if (httpStatus === 400) {
    return fallback || 'Review invite could not be sent for this booking.';
  }
  if (httpStatus === 500) {
    return fallback || 'Something went wrong on the server. Try again in a moment.';
  }
  if (httpStatus === 0) {
    return fallback || 'Network error. Check your connection and try again.';
  }
  return fallback || `Review invite request failed (${httpStatus}).`;
}

/**
 * @param {unknown} payload
 * @returns {ReviewInviteSuccessResponse | null}
 */
function parseReviewInviteSuccessPayload(payload) {
  if (payload?.success !== true) {
    return null;
  }
  if (payload.skipped === true) {
    const reason = typeof payload.reason === 'string' ? payload.reason.trim() : '';
    if (!reason) {
      return null;
    }
    return {
      success: true,
      sent: false,
      skipped: true,
      reason,
    };
  }
  const inviteId =
    typeof payload.inviteId === 'string' && payload.inviteId.trim()
      ? payload.inviteId.trim()
      : null;
  if (!inviteId) {
    return null;
  }
  if (payload.sent === true) {
    return { success: true, sent: true, skipped: false, inviteId };
  }
  return { success: true, sent: false, skipped: false, inviteId };
}

/**
 * Sends review invite email for a completed booking (owner must complete in Supabase first).
 *
 * @param {string | null | undefined} accessToken
 * @param {string} bookingId
 * @returns {Promise<
 *   | { ok: true; data: ReviewInviteSuccessResponse; requestId?: string }
 *   | { ok: false; error: Error; httpStatus: number; requestId?: string }
 * >}
 */
export async function postReviewInviteForBooking(accessToken, bookingId) {
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
    res = await fetch(`${origin}/api/availability/bookings/${encodedId}/review-invite`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
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

  const echoedRequestId = readRequestIdHeader(res.headers) ?? requestId;

  let payload = {};
  try {
    payload = await res.json();
  } catch {
    payload = {};
  }

  const serverMessage = typeof payload?.error === 'string' ? payload.error : null;

  if (res.ok) {
    const data = parseReviewInviteSuccessPayload(payload);
    if (data) {
      return { ok: true, data, requestId: echoedRequestId };
    }
  }

  const msg = mapReviewInviteHttpError(res.status, serverMessage);
  return {
    ok: false,
    error: new Error(msg),
    httpStatus: res.status,
    requestId: echoedRequestId,
  };
}
