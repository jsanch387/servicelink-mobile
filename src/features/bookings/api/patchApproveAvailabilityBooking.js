import { productionWebApiHttpsGuard } from '../../../lib/productionWebApiHttpsGuard';
import { resolveStripeMobileCheckoutOrigin } from '../../../lib/stripeMobileCheckoutOrigin';

/** Server 409 when the request's Chicago calendar day has passed. */
export const APPOINTMENT_REQUEST_EXPIRED_ERROR = 'This request expired.';

/**
 * @param {unknown} error
 */
export function isAppointmentRequestExpiredError(error) {
  const message = error && typeof error === 'object' && 'message' in error ? error.message : error;
  return String(message ?? '').trim() === APPOINTMENT_REQUEST_EXPIRED_ERROR;
}

/**
 * Owner approves a requested appointment via the web API.
 * The server sets status to confirmed and sends the customer email and SMS.
 * Do **not** `UPDATE bookings` in Supabase, and do **not** send those messages from the app.
 *
 * @param {string | null | undefined} accessToken
 * @param {string} bookingId
 * @returns {Promise<
 *   | { ok: true; booking: { id: string; status: string; [key: string]: unknown } }
 *   | { ok: false; error: Error; httpStatus: number }
 * >}
 */
export async function patchApproveAvailabilityBooking(accessToken, bookingId) {
  const origin = resolveStripeMobileCheckoutOrigin();
  const httpsErr = productionWebApiHttpsGuard(origin);
  if (httpsErr) {
    return { ok: false, error: httpsErr, httpStatus: 0 };
  }
  if (!accessToken) {
    return { ok: false, error: new Error('Not signed in'), httpStatus: 0 };
  }
  const id = String(bookingId ?? '').trim();
  if (!id) {
    return { ok: false, error: new Error('Missing booking id'), httpStatus: 0 };
  }

  const encodedId = encodeURIComponent(id);
  let res;
  try {
    res = await fetch(`${origin}/api/availability/bookings/${encodedId}`, {
      method: 'PATCH',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'confirmed' }),
    });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err : new Error('Network request failed'),
      httpStatus: 0,
    };
  }

  let payload =
    /** @type {{ success?: boolean; error?: string; data?: Record<string, unknown> } | null} */ (
      null
    );
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok || !payload?.success || !payload.data) {
    const message =
      typeof payload?.error === 'string' && payload.error.trim()
        ? payload.error.trim()
        : mapApproveHttpError(res.status);
    return {
      ok: false,
      error: new Error(message),
      httpStatus: res.status,
    };
  }

  const data = payload.data;
  const status = String(data.status ?? '')
    .trim()
    .toLowerCase();
  return {
    ok: true,
    booking: {
      ...data,
      id: String(data.id ?? id),
      status: status || 'confirmed',
    },
  };
}

/**
 * @param {number} httpStatus
 * @returns {string}
 */
function mapApproveHttpError(httpStatus) {
  switch (httpStatus) {
    case 400:
      return 'Could not approve this request.';
    case 401:
      return 'Sign in again to approve this request.';
    case 403:
      return 'You don’t have permission to approve this request.';
    case 404:
      return 'Booking not found';
    case 409:
      return 'Could not approve this request.';
    case 500:
      return 'Failed to update booking';
    case 0:
      return 'Network error. Check your connection and try again.';
    default:
      return `Couldn’t approve this request (${httpStatus}).`;
  }
}
