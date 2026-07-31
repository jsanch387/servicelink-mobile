import { localYyyyMmDd } from '../../home/utils/bookingStart';
import { REVENUE_RANGE } from '../constants/paymentsRevenueRanges';

/**
 * @param {Date} d
 * @returns {Date}
 */
function startOfLocalDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Monday-start week containing `d` (local).
 * @param {Date} d
 * @returns {Date}
 */
function startOfWeekMonday(d) {
  const day = startOfLocalDay(d);
  const weekday = day.getDay(); // 0 Sun … 6 Sat
  const offset = weekday === 0 ? -6 : 1 - weekday;
  day.setDate(day.getDate() + offset);
  return day;
}

/**
 * @param {Date} d
 * @param {number} days
 * @returns {Date}
 */
function addDays(d, days) {
  const next = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  next.setDate(next.getDate() + days);
  return next;
}

/**
 * Inclusive local `YYYY-MM-DD` window for a revenue range.
 * `all` returns null bounds (no scheduled_date filter).
 *
 * @param {string} range
 * @param {Date} [now]
 * @returns {{ fromYmd: string | null; toYmd: string | null; prevFromYmd: string | null; prevToYmd: string | null }}
 */
export function revenueDateWindow(range, now = new Date()) {
  const today = startOfLocalDay(now);

  if (range === REVENUE_RANGE.WEEK) {
    const from = startOfWeekMonday(today);
    const to = addDays(from, 6);
    const prevTo = addDays(from, -1);
    const prevFrom = addDays(prevTo, -6);
    return {
      fromYmd: localYyyyMmDd(from),
      toYmd: localYyyyMmDd(to),
      prevFromYmd: localYyyyMmDd(prevFrom),
      prevToYmd: localYyyyMmDd(prevTo),
    };
  }

  if (range === REVENUE_RANGE.MONTH) {
    const from = new Date(today.getFullYear(), today.getMonth(), 1);
    const to = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const prevTo = addDays(from, -1);
    const prevFrom = new Date(prevTo.getFullYear(), prevTo.getMonth(), 1);
    return {
      fromYmd: localYyyyMmDd(from),
      toYmd: localYyyyMmDd(to),
      prevFromYmd: localYyyyMmDd(prevFrom),
      prevToYmd: localYyyyMmDd(prevTo),
    };
  }

  if (range === REVENUE_RANGE.YEAR) {
    const from = new Date(today.getFullYear(), 0, 1);
    const to = new Date(today.getFullYear(), 11, 31);
    const prevFrom = new Date(today.getFullYear() - 1, 0, 1);
    const prevTo = new Date(today.getFullYear() - 1, 11, 31);
    return {
      fromYmd: localYyyyMmDd(from),
      toYmd: localYyyyMmDd(to),
      prevFromYmd: localYyyyMmDd(prevFrom),
      prevToYmd: localYyyyMmDd(prevTo),
    };
  }

  return {
    fromYmd: null,
    toYmd: null,
    prevFromYmd: null,
    prevToYmd: null,
  };
}

/**
 * @param {string} ymd - YYYY-MM-DD
 * @returns {Date}
 */
export function parseLocalYmd(ymd) {
  const [y, m, d] = String(ymd)
    .split('-')
    .map((n) => Number(n));
  return new Date(y, m - 1, d);
}

export { addDays, startOfLocalDay, startOfWeekMonday };
