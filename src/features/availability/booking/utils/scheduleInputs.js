import { normalizeTimeOffBlocksForSave } from '../../utils/availabilityModel';

/**
 * @param {Record<string, unknown> | null | undefined} availabilityRow `business_availability` row
 */
export function parseScheduleInputs(availabilityRow) {
  const acceptBookings = Boolean(availabilityRow?.accept_bookings);
  const ws = availabilityRow?.weekly_schedule;
  const weeklySchedule = ws && typeof ws === 'object' ? ws : {};
  const rawBlocks = Array.isArray(availabilityRow?.time_off_blocks)
    ? availabilityRow.time_off_blocks
    : [];
  const timeOffBlocks = normalizeTimeOffBlocksForSave(rawBlocks);
  return { acceptBookings, weeklySchedule, timeOffBlocks };
}
