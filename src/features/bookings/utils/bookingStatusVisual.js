/**
 * Day planner + list UI: map raw booking status to a stable visual kind.
 *
 * @param {string | null | undefined} status
 * @returns {'cancelled' | 'completed' | 'scheduled'}
 */
export function getBookingStatusVisualKind(status) {
  const s = String(status ?? '')
    .toLowerCase()
    .trim();
  if (s === 'cancelled' || s === 'canceled') {
    return 'cancelled';
  }
  if (s === 'completed' || s === 'complete') {
    return 'completed';
  }
  return 'scheduled';
}

/**
 * Short label shown on planner blocks / pills.
 *
 * @param {string | null | undefined} status
 */
export function getBookingStatusLabel(status) {
  switch (getBookingStatusVisualKind(status)) {
    case 'cancelled':
      return 'Cancelled';
    case 'completed':
      return 'Completed';
    default:
      return 'Upcoming';
  }
}
