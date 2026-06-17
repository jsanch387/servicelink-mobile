import { productionWebApiHttpsGuard } from '../../../lib/productionWebApiHttpsGuard';
import { resolveStripeMobileCheckoutOrigin } from '../../../lib/stripeMobileCheckoutOrigin';
import { BOOKING_ACTION } from '../constants/jobStatus';
import { parseBookingEmailOutcome } from '../utils/parseBookingEmailOutcome';
import { parseBookingSmsOutcome } from '../utils/parseBookingSmsOutcome';

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
 * @param {number} httpStatus
 * @param {string | null} serverMessage
 * @returns {string}
 */
export function mapBookingActionHttpError(httpStatus, serverMessage) {
  const fallback = serverMessage?.trim() || null;
  switch (httpStatus) {
    case 400:
      return fallback || 'Something went wrong. Please try again.';
    case 401:
      return 'Sign in again to update this appointment.';
    case 404:
      return fallback || 'Appointment not found.';
    case 409:
      return fallback || 'This action is not available for this appointment.';
    case 429:
      return fallback || 'You’re sending updates too quickly. Try again shortly.';
    case 500:
      return fallback || 'Something went wrong on the server. Try again in a moment.';
    case 0:
      return fallback || 'Network error. Check your connection and try again.';
    default:
      return fallback || `Couldn’t complete the action (${httpStatus}).`;
  }
}

/**
 * @param {unknown} payload
 * @returns {{ sent: boolean; messageId: string | null; reason: string | null }}
 */
function readSmsOutcome(payload) {
  const parsed = parseBookingSmsOutcome(payload);
  return parsed ?? { sent: false, messageId: null, reason: null };
}

/**
 * @param {unknown} payload
 * @returns {{ sent: boolean; messageId: string | null; reason: string | null }}
 */
function readEmailOutcome(payload) {
  const parsed = parseBookingEmailOutcome(payload);
  return parsed ?? { sent: false, messageId: null, reason: null };
}

/**
 * Runs an owner booking action (state transition + optional customer SMS).
 *
 * @param {string | null | undefined} accessToken
 * @param {string} bookingId
 * @param {string} action {@link BOOKING_ACTION} value
 * @returns {Promise<
 *   | {
 *       ok: true;
 *       requestId?: string;
 *       action: string;
 *       jobStatus: string;
 *       bookingStatus: string | null;
 *       smsSent: boolean;
 *       smsReason: string | null;
 *       emailSent: boolean;
 *       emailReason: string | null;
 *       messageId: string | null;
 *     }
 *   | { ok: false; error: Error; httpStatus: number; retryAfterSec?: number; requestId?: string }
 * >}
 */
export async function postBookingAction(accessToken, bookingId, action) {
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
  if (!action?.trim() || !Object.values(BOOKING_ACTION).includes(action)) {
    return { ok: false, error: new Error('Invalid booking action'), httpStatus: 0 };
  }

  const requestId = createRequestId();
  const encodedId = encodeURIComponent(bookingId.trim());

  let res;
  try {
    res = await fetch(`${origin}/api/availability/bookings/${encodedId}/actions`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
      },
      body: JSON.stringify({ action }),
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

  if (res.ok && payload?.success === false) {
    return {
      ok: false,
      error: new Error(mapBookingActionHttpError(res.status, serverMessage)),
      httpStatus: res.status,
      retryAfterSec: readRetryAfterSeconds(res.headers),
      requestId: echoedRequestId,
    };
  }

  if (res.ok && payload?.success === true) {
    const sms = readSmsOutcome(payload);
    const email = readEmailOutcome(payload);
    const jobStatus =
      typeof payload?.jobStatus === 'string'
        ? payload.jobStatus
        : typeof payload?.job_status === 'string'
          ? payload.job_status
          : '';
    const resolvedAction = typeof payload?.action === 'string' ? payload.action : action;
    const bookingStatus =
      typeof payload?.bookingStatus === 'string'
        ? payload.bookingStatus
        : typeof payload?.booking_status === 'string'
          ? payload.booking_status
          : null;

    return {
      ok: true,
      requestId: echoedRequestId,
      action: resolvedAction,
      jobStatus,
      bookingStatus,
      smsSent: sms.sent,
      smsReason: sms.reason,
      emailSent: email.sent,
      emailReason: email.reason,
      messageId: sms.messageId,
    };
  }

  return {
    ok: false,
    error: new Error(mapBookingActionHttpError(res.status, serverMessage)),
    httpStatus: res.status,
    retryAfterSec: readRetryAfterSeconds(res.headers),
    requestId: echoedRequestId,
  };
}

/** @deprecated Use {@link postBookingAction} with `BOOKING_ACTION.ON_THE_WAY`. */
export async function postOnMyWayForBooking(accessToken, bookingId) {
  return postBookingAction(accessToken, bookingId, BOOKING_ACTION.ON_THE_WAY);
}
