import { toLocalYyyyMmDd } from '../../../../components/ui/calendarDateKey';
import { generateTimeSlots } from './slotGeneration';

/**
 * Shared inputs for slot generation (single source for list + calendar disabled days).
 *
 * @typedef {object} ScheduleSlotContext
 * @property {boolean} acceptBookings
 * @property {Record<string, unknown>} weeklySchedule
 * @property {number} totalDurationMinutes
 * @property {unknown[]} blockingBookingRows
 * @property {unknown[]} timeOffBlocks
 */

/**
 * @param {ScheduleSlotContext} ctx
 * @param {string | null} dateKey local YYYY-MM-DD
 * @returns {string[]}
 */
export function computeTimeSlotsForDateKey(dateKey, ctx) {
  if (!dateKey || !ctx.acceptBookings) return [];
  return generateTimeSlots({
    dateKey,
    weeklySchedule: ctx.weeklySchedule,
    serviceDurationMinutes: ctx.totalDurationMinutes,
    existingBookings: ctx.blockingBookingRows,
    timeOffBlocks: ctx.timeOffBlocks,
  });
}

/**
 * @param {ScheduleSlotContext} ctx
 * @returns {(d: Date) => boolean} true = day has no bookable slots (or bookings off)
 */
export function createIsDateUnavailablePredicate(ctx) {
  return (d) => {
    if (!ctx.acceptBookings) return true;
    const key = toLocalYyyyMmDd(d);
    return computeTimeSlotsForDateKey(key, ctx).length === 0;
  };
}
