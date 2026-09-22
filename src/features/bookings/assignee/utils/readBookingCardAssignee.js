import { presentPersonDisplay } from '../../../../utils/presentPersonDisplay';
import { readAssignedUserId } from './readAssignedUserId';

/**
 * List/planner cards prefer the name stamped on the booking, then the shop roster.
 *
 * @param {object | null | undefined} booking
 * @param {string | null | undefined} currentUserId
 * @param {{
 *   canAssign?: boolean;
 *   labelFor?: (assignedUserId: string | null | undefined) => string | null;
 * } | null | undefined} [roster]
 * @returns {{ initial: string; name: string } | null}
 */
export function readBookingCardAssignee(booking, currentUserId, roster) {
  const assignedUserId = readAssignedUserId(booking);
  if (!assignedUserId) {
    return null;
  }
  const canAssign = Boolean(roster?.canAssign || booking?.shop_can_assign);
  if (!canAssign) {
    return null;
  }
  const viewer = String(currentUserId ?? '').trim();
  const rawLabel =
    roster?.labelFor?.(assignedUserId) ||
    (viewer && assignedUserId === viewer
      ? 'Myself'
      : String(booking.assigned_user_name ?? booking.assignedUserName ?? '').trim());
  if (!rawLabel) {
    return null;
  }
  const presented = presentPersonDisplay(rawLabel);
  const firstName = presented.title.split(/\s+/)[0] || presented.title;
  if (!firstName) {
    return null;
  }
  return { initial: presented.initial, name: firstName };
}
