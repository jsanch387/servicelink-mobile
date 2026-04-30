/**
 * Normalizes `business_availability` row fields used by the schedule step.
 *
 * @param {Record<string, unknown> | null | undefined} availabilityRow
 * @returns {{
 *   acceptBookings: boolean;
 *   weeklySchedule: Record<string, unknown>;
 *   timeOffBlocks: unknown[];
 * }}
 */
export function parseAvailabilityForSchedule(availabilityRow) {
  const acceptBookings = Boolean(availabilityRow?.accept_bookings);
  const ws = availabilityRow?.weekly_schedule;
  const weeklySchedule = ws && typeof ws === 'object' ? ws : {};
  const b = availabilityRow?.time_off_blocks;
  const timeOffBlocks = Array.isArray(b) ? b : [];
  return { acceptBookings, weeklySchedule, timeOffBlocks };
}
