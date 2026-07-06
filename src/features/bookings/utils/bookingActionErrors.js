/**
 * Server returns 409 when the transition is invalid or already applied.
 *
 * @param {string | null | undefined} message
 * @returns {boolean}
 */
export function isBookingActionConflictError(message) {
  const m = String(message ?? '').toLowerCase();
  return (
    m.includes('already') ||
    m.includes('not available for') ||
    m.includes('invalid transition') ||
    m.includes('cannot transition')
  );
}

/** @deprecated Use {@link isBookingActionConflictError}. */
export function isOnMyWayAlreadySentError(message) {
  return isBookingActionConflictError(message);
}
