/**
 * @param {{ on_my_way_sent_at?: string | null } | null | undefined} booking
 * @returns {boolean}
 */
export function isOnMyWaySent(booking) {
  const raw = booking?.on_my_way_sent_at;
  return typeof raw === 'string' && raw.trim().length > 0;
}

/**
 * Server returns 409 when the on-my-way SMS was already sent for this booking.
 *
 * @param {string | null | undefined} message
 * @returns {boolean}
 */
export function isOnMyWayAlreadySentError(message) {
  const m = String(message ?? '').toLowerCase();
  return m.includes('already sent') || m.includes('already notified');
}
