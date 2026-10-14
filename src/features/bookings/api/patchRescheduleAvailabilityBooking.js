import { productionWebApiHttpsGuard } from '../../../lib/productionWebApiHttpsGuard';
import { resolveStripeMobileCheckoutOrigin } from '../../../lib/stripeMobileCheckoutOrigin';

/**
 * Owner moves a confirmed availability booking via the web API.
 * The server owns the slot check, the row update, and the customer email + SMS.
 * Do **not** `UPDATE bookings` in Supabase for reschedule, and do **not** send the notice from the app.
 *
 * @param {string | null | undefined} accessToken
 * @param {string} bookingId
 * @param {{ scheduledDate: string; startTime: string }} slot `startTime` is 24-hour `HH:mm`
 * @returns {Promise<
 *   | { ok: true; booking: { id: string; status: string; date: string; time: string; startTimeHHmm: string; [key: string]: unknown } }
 *   | { ok: false; error: Error; httpStatus: number }
 * >}
 */
export async function patchRescheduleAvailabilityBooking(accessToken, bookingId, slot) {
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

  const scheduledDate = String(slot?.scheduledDate ?? '').trim();
  const startTime = String(slot?.startTime ?? '').trim();
  if (!scheduledDate || !startTime) {
    return {
      ok: false,
      error: new Error('Choose a date and time.'),
      httpStatus: 0,
    };
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
      body: JSON.stringify({ scheduledDate, startTime }),
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
        : mapRescheduleHttpError(res.status);
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
      date: String(data.date ?? scheduledDate),
      time: String(data.time ?? ''),
      startTimeHHmm: String(data.startTimeHHmm ?? startTime),
    },
  };
}

/**
 * Map the dashboard display payload onto the local booking row (`scheduled_date` / `start_time`).
 * Leaves discount columns for the details refetch. Does not copy display-only fields onto the row.
 *
 * @param {Record<string, unknown> | null | undefined} prev
 * @param {{ date?: string; time?: string; startTimeHHmm?: string; status?: string } | null | undefined} booking
 */
export function applyRescheduleDisplayToBookingRow(prev, booking) {
  if (!prev || typeof prev !== 'object') return prev;
  const date = String(booking?.date ?? '').trim();
  const startTime = sqlTimeFromRescheduleDisplay(booking);
  const status = String(booking?.status ?? '')
    .trim()
    .toLowerCase();
  return {
    ...prev,
    ...(date ? { scheduled_date: date } : {}),
    ...(startTime ? { start_time: startTime } : {}),
    ...(status ? { status } : {}),
  };
}

/**
 * @param {{ time?: string; startTimeHHmm?: string } | null | undefined} booking
 * @returns {string | null} `HH:mm:ss` or null when the display payload has no clock time
 */
function sqlTimeFromRescheduleDisplay(booking) {
  const hhmm = String(booking?.startTimeHHmm ?? '').trim();
  const fromGrid = hhmm.match(/^(\d{1,2}):(\d{2})$/);
  if (fromGrid) {
    return `${fromGrid[1].padStart(2, '0')}:${fromGrid[2]}:00`;
  }
  return sqlTimeFromDisplayLabel(booking?.time);
}

/**
 * @param {unknown} label e.g. `2:30 PM`
 * @returns {string | null}
 */
function sqlTimeFromDisplayLabel(label) {
  const match = String(label ?? '')
    .trim()
    .match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = match[2];
  const period = match[3].toUpperCase();
  if (period === 'AM' && hour === 12) hour = 0;
  if (period === 'PM' && hour !== 12) hour += 12;
  if (!Number.isFinite(hour) || hour > 23) return null;
  return `${String(hour).padStart(2, '0')}:${minute}:00`;
}

/**
 * @param {number} httpStatus
 * @returns {string}
 */
function mapRescheduleHttpError(httpStatus) {
  switch (httpStatus) {
    case 400:
      return 'Could not reschedule this appointment.';
    case 401:
      return 'Sign in again to reschedule this appointment.';
    case 403:
      return 'Forbidden';
    case 404:
      return 'Appointment not found.';
    case 409:
      return 'That time is not available. Pick another slot.';
    case 500:
      return 'Something went wrong on the server. Try again in a moment.';
    case 0:
      return 'Network error. Check your connection and try again.';
    default:
      return `Couldn’t reschedule the appointment (${httpStatus}).`;
  }
}
