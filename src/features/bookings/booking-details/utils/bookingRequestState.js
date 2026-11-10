export const BOOKING_REQUEST_PENDING_COPY = 'This customer asked for this time.';

export const BOOKING_REQUEST_EXPIRED_COPY = 'This request expired. The date has passed.';

/**
 * Device-local calendar day as YYYY-MM-DD.
 *
 * @param {Date} [now]
 */
export function localCalendarDateKey(now = new Date()) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Request-appointment presentation for booking details.
 * Confirmed, completed, and cancelled visits return `none`.
 *
 * @param {{ status?: string | null; scheduledDate?: string | null; today?: string }} input
 * @returns {{ kind: 'pending' | 'expired' | 'none'; message: string }}
 */
export function bookingRequestState({ status, scheduledDate, today } = {}) {
  const normalized = String(status ?? '')
    .trim()
    .toLowerCase();
  const date = String(scheduledDate ?? '')
    .trim()
    .slice(0, 10);
  const todayKey = today || localCalendarDateKey();
  const datePassed = /^\d{4}-\d{2}-\d{2}$/.test(date) && date < todayKey;

  if (normalized === 'expired' || (normalized === 'requested' && datePassed)) {
    return { kind: 'expired', message: BOOKING_REQUEST_EXPIRED_COPY };
  }
  if (normalized === 'requested') {
    return { kind: 'pending', message: BOOKING_REQUEST_PENDING_COPY };
  }
  return { kind: 'none', message: '' };
}
