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

const EMPTY_WINDOW = Object.freeze({
  fromYmd: null,
  toYmd: null,
  prevFromYmd: null,
  prevToYmd: null,
});

/**
 * Inclusive day count between two local `YYYY-MM-DD` keys (DST-safe).
 * @param {string} fromYmd
 * @param {string} toYmd
 * @returns {number}
 */
export function inclusiveDayCount(fromYmd, toYmd) {
  const from = parseLocalYmd(fromYmd);
  const to = parseLocalYmd(toYmd);
  const a = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const b = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((b - a) / 86400000) + 1;
}

/**
 * Inclusive custom window plus the same-length period immediately before.
 * Swaps bounds when `to` is before `from`.
 *
 * @param {string | null | undefined} fromYmd
 * @param {string | null | undefined} toYmd
 * @returns {{ fromYmd: string | null; toYmd: string | null; prevFromYmd: string | null; prevToYmd: string | null }}
 */
export function revenueCustomDateWindow(fromYmd, toYmd) {
  let from = String(fromYmd ?? '').trim();
  let to = String(toYmd ?? '').trim();
  if (!from || !to) return { ...EMPTY_WINDOW };
  if (to < from) {
    const swap = from;
    from = to;
    to = swap;
  }

  const fromDate = parseLocalYmd(from);
  const days = inclusiveDayCount(from, to);
  const prevTo = addDays(fromDate, -1);
  const prevFrom = addDays(prevTo, -(days - 1));
  return {
    fromYmd: from,
    toYmd: to,
    prevFromYmd: localYyyyMmDd(prevFrom),
    prevToYmd: localYyyyMmDd(prevTo),
  };
}

const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/**
 * Compact trigger label for a custom revenue window.
 * @param {string | null | undefined} fromYmd
 * @param {string | null | undefined} toYmd
 * @returns {string}
 */
/**
 * Custom revenue UI requires two different local dates.
 * @param {string | null | undefined} fromYmd
 * @param {string | null | undefined} toYmd
 * @returns {boolean}
 */
export function isCompleteCustomRevenueRange(fromYmd, toYmd) {
  const from = String(fromYmd ?? '').trim();
  const to = String(toYmd ?? '').trim();
  return Boolean(from && to && from !== to);
}

export function formatRevenueCustomRangeLabel(fromYmd, toYmd) {
  const window = revenueCustomDateWindow(fromYmd, toYmd);
  if (!window.fromYmd || !window.toYmd) return 'Custom';

  const from = parseLocalYmd(window.fromYmd);
  const to = parseLocalYmd(window.toYmd);
  const sameDay = window.fromYmd === window.toYmd;
  const sameYear = from.getFullYear() === to.getFullYear();
  const sameMonth = sameYear && from.getMonth() === to.getMonth();

  const monthDay = (d) => `${MONTH_SHORT[d.getMonth()]} ${d.getDate()}`;
  const withYear = (d) => `${monthDay(d)}, ${d.getFullYear()}`;

  if (sameDay) return monthDay(from);
  if (sameMonth) return `${monthDay(from)}–${to.getDate()}`;
  if (sameYear) return `${monthDay(from)}–${monthDay(to)}`;
  return `${withYear(from)}–${withYear(to)}`;
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
