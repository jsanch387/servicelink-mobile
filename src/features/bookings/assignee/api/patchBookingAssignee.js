import { productionWebApiHttpsGuard } from '../../../../lib/productionWebApiHttpsGuard';
import { resolveStripeMobileCheckoutOrigin } from '../../../../lib/stripeMobileCheckoutOrigin';

/**
 * `PATCH /api/availability/bookings/:bookingId/assignee`
 *
 * Server owns `updateBookingAssignee` (service role) and
 * `notifyAssigneeForJobAssigned` / `shouldNotifyJobAssigned`.
 * Do **not** `UPDATE bookings` from the app. Do not send `businessId`.
 *
 * @param {string | null | undefined} accessToken
 * @param {string} bookingId
 * @param {string | null | undefined} assignedUserId `auth.users.id`, or null to unassign
 * @returns {Promise<
 *   | { ok: true; bookingId: string; assignedUserId: string | null }
 *   | { ok: false; error: Error; httpStatus: number }
 * >}
 */
export async function patchBookingAssignee(accessToken, bookingId, assignedUserId) {
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

  const nextAssignee =
    typeof assignedUserId === 'string' && assignedUserId.trim() ? assignedUserId.trim() : null;

  const encodedId = encodeURIComponent(id);
  let res;
  try {
    res = await fetch(`${origin}/api/availability/bookings/${encodedId}/assignee`, {
      method: 'PATCH',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ assignedUserId: nextAssignee }),
    });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err : new Error('Network request failed'),
      httpStatus: 0,
    };
  }

  let payload =
    /** @type {{ success?: boolean; error?: string; data?: { assignedUserId?: string | null } } | null} */ (
      null
    );
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok || payload?.success !== true) {
    const message =
      typeof payload?.error === 'string' && payload.error.trim()
        ? payload.error.trim()
        : mapAssigneeHttpError(res.status);
    return {
      ok: false,
      error: new Error(message),
      httpStatus: res.status,
    };
  }

  const raw = payload.data?.assignedUserId ?? nextAssignee;
  const savedId = typeof raw === 'string' && raw.trim() ? raw.trim() : null;

  return {
    ok: true,
    bookingId: id,
    assignedUserId: savedId,
  };
}

/**
 * @param {number} httpStatus
 * @returns {string}
 */
function mapAssigneeHttpError(httpStatus) {
  switch (httpStatus) {
    case 400:
      return 'Could not assign this appointment.';
    case 401:
      return 'Sign in again to assign this appointment.';
    case 403:
      return 'You do not have access to assign this appointment.';
    case 404:
      return 'Appointment not found.';
    case 409:
      return 'This appointment can no longer be assigned.';
    case 500:
      return 'Something went wrong on the server. Try again in a moment.';
    case 0:
      return 'Network error. Check your connection and try again.';
    default:
      return `Couldn’t assign the appointment (${httpStatus}).`;
  }
}
