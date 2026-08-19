import { productionWebApiHttpsGuard } from '../../../lib/productionWebApiHttpsGuard';
import { resolveStripeMobileCheckoutOrigin } from '../../../lib/stripeMobileCheckoutOrigin';

/**
 * Owner cancels a confirmed availability booking via the web API.
 * Server owns status update, cancel email, and membership period-visit unlink.
 * Do **not** `UPDATE bookings` in Supabase for cancel.
 *
 * @param {string | null | undefined} accessToken
 * @param {string} bookingId
 * @returns {Promise<
 *   | { ok: true; booking: { id: string; status: string; [key: string]: unknown } }
 *   | { ok: false; error: Error; httpStatus: number }
 * >}
 */
export async function patchCancelAvailabilityBooking(accessToken, bookingId) {
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
      body: JSON.stringify({ status: 'cancelled' }),
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
        : mapCancelHttpError(res.status);
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
      status: status || 'cancelled',
    },
  };
}

/**
 * @param {number} httpStatus
 * @returns {string}
 */
function mapCancelHttpError(httpStatus) {
  switch (httpStatus) {
    case 400:
      return 'Could not cancel this appointment.';
    case 401:
      return 'Sign in again to cancel this appointment.';
    case 404:
      return 'Appointment not found.';
    case 500:
      return 'Something went wrong on the server. Try again in a moment.';
    case 0:
      return 'Network error. Check your connection and try again.';
    default:
      return `Couldn’t cancel the appointment (${httpStatus}).`;
  }
}
