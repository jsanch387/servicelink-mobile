import { parseLocalYyyyMmDd, toLocalYyyyMmDd } from './calendarDateKey';

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

const EMPTY_WINDOW = Object.freeze({
  fromYmd: null,
  toYmd: null,
  prevFromYmd: null,
  prevToYmd: null,
});

function addLocalDays(date, days) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/**
 * Inclusive day count between two local `YYYY-MM-DD` keys (DST-safe).
 *
 * @param {string} fromYmd
 * @param {string} toYmd
 */
export function inclusiveDayCount(fromYmd, toYmd) {
  const from = parseLocalYyyyMmDd(fromYmd);
  const to = parseLocalYyyyMmDd(toYmd);
  if (!from || !to) return 0;
  const a = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const b = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((b - a) / 86400000) + 1;
}

/**
 * Custom UI requires two different local dates.
 *
 * @param {string | null | undefined} fromYmd
 * @param {string | null | undefined} toYmd
 */
export function isCompleteCustomDateRange(fromYmd, toYmd) {
  const from = String(fromYmd ?? '').trim();
  const to = String(toYmd ?? '').trim();
  return Boolean(from && to && from !== to);
}

/**
 * Inclusive custom window plus the same-length period immediately before.
 * Swaps bounds when `to` is before `from`.
 *
 * @param {string | null | undefined} fromYmd
 * @param {string | null | undefined} toYmd
 */
export function customDateWindow(fromYmd, toYmd) {
  let from = String(fromYmd ?? '').trim();
  let to = String(toYmd ?? '').trim();
  if (!from || !to) return { ...EMPTY_WINDOW };
  if (to < from) {
    const swap = from;
    from = to;
    to = swap;
  }

  const fromDate = parseLocalYyyyMmDd(from);
  if (!fromDate) return { ...EMPTY_WINDOW };

  const days = inclusiveDayCount(from, to);
  const prevTo = addLocalDays(fromDate, -1);
  const prevFrom = addLocalDays(prevTo, -(days - 1));
  return {
    fromYmd: from,
    toYmd: to,
    prevFromYmd: toLocalYyyyMmDd(prevFrom),
    prevToYmd: toLocalYyyyMmDd(prevTo),
  };
}

/**
 * Compact trigger label for a custom window (`Mar 3–18`).
 *
 * @param {string | null | undefined} fromYmd
 * @param {string | null | undefined} toYmd
 */
export function formatCustomDateRangeLabel(fromYmd, toYmd) {
  const window = customDateWindow(fromYmd, toYmd);
  if (!window.fromYmd || !window.toYmd) return 'Custom';

  const from = parseLocalYyyyMmDd(window.fromYmd);
  const to = parseLocalYyyyMmDd(window.toYmd);
  if (!from || !to) return 'Custom';

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
