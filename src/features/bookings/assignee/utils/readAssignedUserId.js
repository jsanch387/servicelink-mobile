/**
 * @param {object | null | undefined} booking
 * @returns {string | null}
 */
export function readAssignedUserId(booking) {
  const raw = booking?.assigned_user_id ?? booking?.assignedUserId;
  const id = typeof raw === 'string' ? raw.trim() : '';
  return id || null;
}
