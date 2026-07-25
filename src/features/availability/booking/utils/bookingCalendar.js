import { parseLocalYyyyMmDd, toLocalYyyyMmDd } from '../../../../components/ui/calendarDateKey';
import { generateTimeSlots } from './slotGeneration';

/**
 * @typedef {object} BookingScheduleContext
 * @property {boolean} acceptBookings
 * @property {Record<string, unknown>} weeklySchedule
 * @property {number} totalDurationMinutes
 * @property {unknown[]} blockingBookingRows
 * @property {unknown[]} timeOffBlocks
 * @property {string} [minimumNotice]
 * @property {boolean} [ownerManualBooking] Owner create/edit — skip lead time + time off; allow scheduling even when public booking is off.
 */

/**
 * @param {string | null | undefined} dateKey
 * @returns {string} e.g. "Wednesday, April 29, 2026"
 */
export function formatSelectedDateLabel(dateKey) {
  const d = parseLocalYyyyMmDd(dateKey ?? '');
  if (!d) return '';
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * @param {BookingScheduleContext} ctx
 */
function scheduleAllowsBooking(ctx) {
  return Boolean(ctx.acceptBookings || ctx.ownerManualBooking);
}

/**
 * @param {string | null} dateKey local YYYY-MM-DD
 * @param {BookingScheduleContext} ctx
 * @returns {string[]}
 */
export function getTimeSlotsForDateKey(dateKey, ctx) {
  if (!dateKey || !scheduleAllowsBooking(ctx)) return [];
  return generateTimeSlots({
    dateKey,
    weeklySchedule: ctx.weeklySchedule,
    serviceDurationMinutes: ctx.totalDurationMinutes,
    existingBookings: ctx.blockingBookingRows,
    timeOffBlocks: ctx.timeOffBlocks,
    minimumNotice: ctx.minimumNotice ?? 'none',
    ownerManualBooking: Boolean(ctx.ownerManualBooking),
  });
}

/**
 * @param {BookingScheduleContext} ctx
 * @returns {(d: Date) => boolean} true when the day has no bookable slots
 */
export function createIsDateUnavailableFn(ctx) {
  const cache = new Map();
  return (d) => {
    if (!scheduleAllowsBooking(ctx)) return true;
    const key = toLocalYyyyMmDd(d);
    if (!key) return true;
    if (cache.has(key)) return cache.get(key);
    const unavailable = getTimeSlotsForDateKey(key, ctx).length === 0;
    cache.set(key, unavailable);
    return unavailable;
  };
}

/**
 * @param {BookingScheduleContext} ctx
 * @param {string | null} selectedDateKey
 * @param {string | null} selectedTime
 */
export function isSelectedScheduleStillValid(
  ctx,
  selectedDateKey,
  selectedTime,
  { scheduleLoading },
) {
  if (scheduleLoading || !scheduleAllowsBooking(ctx) || !selectedDateKey) {
    return { dateValid: !selectedDateKey, timeValid: !selectedTime };
  }
  const d = parseLocalYyyyMmDd(selectedDateKey);
  const isDateUnavailable = createIsDateUnavailableFn(ctx);
  const dateValid = Boolean(d && !isDateUnavailable(d));
  const slots = dateValid ? getTimeSlotsForDateKey(selectedDateKey, ctx) : [];
  const timeValid = Boolean(selectedTime && slots.includes(selectedTime));
  return { dateValid, timeValid };
}
