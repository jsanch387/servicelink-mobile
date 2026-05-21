import { toLocalYyyyMmDd } from '../../../components/ui/calendarDateKey';

/**
 * @param {Date} monthStart first day of month (any time; normalized to local midnight)
 * @returns {{ start: string; end: string }} inclusive `YYYY-MM-DD` bounds
 */
export function getMonthDateRangeKeys(monthStart) {
  const y = monthStart.getFullYear();
  const m = monthStart.getMonth();
  const start = toLocalYyyyMmDd(new Date(y, m, 1));
  const end = toLocalYyyyMmDd(new Date(y, m + 1, 0));
  return { start, end };
}

/**
 * Sunday-first week containing `anchor`.
 *
 * @param {Date} anchor
 * @returns {{ start: string; end: string }}
 */
export function getWeekDateRangeKeys(anchor) {
  const start = new Date(anchor);
  start.setHours(0, 0, 0, 0);
  const offset = start.getDay();
  start.setDate(start.getDate() - offset);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return {
    start: toLocalYyyyMmDd(start),
    end: toLocalYyyyMmDd(end),
  };
}

/**
 * @param {Date} anchor
 * @returns {Date[]} seven dates, Sunday-first
 */
export function weekDaysFromAnchor(anchor) {
  const start = new Date(anchor);
  start.setHours(0, 0, 0, 0);
  const offset = start.getDay();
  start.setDate(start.getDate() - offset);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}
