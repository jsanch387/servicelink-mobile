import { calendarYyyyMmDdFromScheduledDate, localYyyyMmDd } from '../../home/utils/bookingStart';
import { computeBookingEarningsCents } from '../../home/utils/todaysEarnings';
import { REVENUE_RANGE } from '../constants/paymentsRevenueRanges';
import { addDays, parseLocalYmd, revenueDateWindow } from './revenueDateWindows';

/**
 * @typedef {{ label: string; fullLabel: string; cents: number; key: string }} RevenueBar
 * @typedef {{
 *   collectedCents: number;
 *   jobsPaid: number;
 *   changePct: number | null;
 *   compareLabel: string | null;
 *   bars: RevenueBar[];
 * }} PaymentsRevenueSummary
 */

/**
 * @param {object} row
 * @returns {string} YYYY-MM-DD
 */
function rowCalendarDay(row) {
  return calendarYyyyMmDdFromScheduledDate(row?.scheduled_date);
}

/**
 * @param {object[] | null | undefined} rows
 * @returns {{ collectedCents: number; jobsPaid: number; byDay: Map<string, number> }}
 */
function summarizeCompletedRows(rows) {
  /** @type {Map<string, number>} */
  const byDay = new Map();
  let collectedCents = 0;
  let jobsPaid = 0;

  for (const row of rows ?? []) {
    const status = String(row?.status ?? '')
      .trim()
      .toLowerCase();
    if (status !== 'completed') continue;

    const earnings = computeBookingEarningsCents(row);
    if (!earnings) continue;
    const day = rowCalendarDay(row);
    if (!day) continue;
    const jobCents = earnings.collectedCents;
    collectedCents += jobCents;
    jobsPaid += 1;
    byDay.set(day, (byDay.get(day) ?? 0) + jobCents);
  }

  return { collectedCents, jobsPaid, byDay };
}

/**
 * @param {Map<string, number>} byDay
 * @param {string} fromYmd
 * @param {string} toYmd
 * @returns {number}
 */
function sumDaysInRange(byDay, fromYmd, toYmd) {
  let total = 0;
  let cursor = parseLocalYmd(fromYmd);
  const end = parseLocalYmd(toYmd);
  while (cursor.getTime() <= end.getTime()) {
    const ymd = localYyyyMmDd(cursor);
    total += byDay.get(ymd) ?? 0;
    cursor = addDays(cursor, 1);
  }
  return total;
}

const WEEKDAY_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const WEEKDAY_MED = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
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
const MONTH_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/**
 * @param {Map<string, number>} byDay
 * @param {string} fromYmd
 * @param {string} toYmd
 * @returns {RevenueBar[]}
 */
function barsForWeek(byDay, fromYmd, toYmd) {
  /** @type {RevenueBar[]} */
  const bars = [];
  let cursor = parseLocalYmd(fromYmd);
  const end = parseLocalYmd(toYmd);
  while (cursor.getTime() <= end.getTime()) {
    const ymd = localYyyyMmDd(cursor);
    const weekday = cursor.getDay();
    const monthShort = MONTH_SHORT[cursor.getMonth()];
    const dayNum = cursor.getDate();
    bars.push({
      key: ymd,
      label: WEEKDAY_SHORT[weekday],
      fullLabel: `${WEEKDAY_MED[weekday]}, ${monthShort} ${dayNum}`,
      cents: byDay.get(ymd) ?? 0,
    });
    cursor = addDays(cursor, 1);
  }
  return bars;
}

/**
 * Exactly four weeks inside the calendar month:
 * Wk 1 = days 1–7, Wk 2 = 8–14, Wk 3 = 15–21, Wk 4 = 22–end.
 *
 * @param {Map<string, number>} byDay
 * @param {string} fromYmd
 * @param {string} toYmd
 * @returns {RevenueBar[]}
 */
function barsForMonth(byDay, fromYmd, toYmd) {
  const monthStart = parseLocalYmd(fromYmd);
  const monthEnd = parseLocalYmd(toYmd);
  const year = monthStart.getFullYear();
  const month = monthStart.getMonth();
  const lastDay = monthEnd.getDate();

  const segments = [
    { startDay: 1, endDay: Math.min(7, lastDay) },
    { startDay: 8, endDay: Math.min(14, lastDay) },
    { startDay: 15, endDay: Math.min(21, lastDay) },
    { startDay: 22, endDay: lastDay },
  ].filter((seg) => seg.startDay <= lastDay);

  return segments.map(({ startDay, endDay }, index) => {
    const weekIndex = index + 1;
    const from = new Date(year, month, startDay);
    const to = new Date(year, month, endDay);
    return {
      key: `${year}-${month + 1}-w${weekIndex}`,
      label: `Wk ${weekIndex}`,
      fullLabel: `Week ${weekIndex}`,
      cents: sumDaysInRange(byDay, localYyyyMmDd(from), localYyyyMmDd(to)),
    };
  });
}

/**
 * @param {Map<string, number>} byDay
 * @param {number} year
 * @returns {RevenueBar[]}
 */
function barsForYear(byDay, year) {
  return MONTH_SHORT.map((label, monthIndex) => {
    const from = new Date(year, monthIndex, 1);
    const to = new Date(year, monthIndex + 1, 0);
    return {
      key: `${year}-${monthIndex + 1}`,
      label,
      fullLabel: MONTH_LONG[monthIndex],
      cents: sumDaysInRange(byDay, localYyyyMmDd(from), localYyyyMmDd(to)),
    };
  });
}

/**
 * @param {Map<string, number>} byDay
 * @returns {RevenueBar[]}
 */
function barsForAllTime(byDay) {
  /** @type {Map<number, number>} */
  const byYear = new Map();
  for (const [ymd, cents] of byDay.entries()) {
    const year = Number(ymd.slice(0, 4));
    if (!Number.isFinite(year)) continue;
    byYear.set(year, (byYear.get(year) ?? 0) + cents);
  }

  const years = [...byYear.keys()].sort((a, b) => a - b);
  if (years.length === 0) {
    const y = new Date().getFullYear();
    return [{ key: String(y), label: String(y), fullLabel: String(y), cents: 0 }];
  }

  return years.map((year) => ({
    key: String(year),
    label: String(year),
    fullLabel: String(year),
    cents: byYear.get(year) ?? 0,
  }));
}

/**
 * @param {number} current
 * @param {number} previous
 * @returns {number | null}
 */
function changePercent(current, previous) {
  if (previous <= 0) {
    return current > 0 ? 100 : null;
  }
  return Math.round(((current - previous) / previous) * 100);
}

/**
 * Build revenue summary for the Payments chart (completed appointments only).
 *
 * @param {{
 *   range: string;
 *   currentRows: object[] | null | undefined;
 *   previousRows?: object[] | null | undefined;
 *   now?: Date;
 * }} args
 * @returns {PaymentsRevenueSummary}
 */
export function aggregatePaymentsRevenue({
  range,
  currentRows,
  previousRows = [],
  now = new Date(),
}) {
  const window = revenueDateWindow(range, now);
  const current = summarizeCompletedRows(currentRows);
  const previous = summarizeCompletedRows(previousRows);

  /** @type {RevenueBar[]} */
  let bars = [];
  if (range === REVENUE_RANGE.WEEK && window.fromYmd && window.toYmd) {
    bars = barsForWeek(current.byDay, window.fromYmd, window.toYmd);
  } else if (range === REVENUE_RANGE.MONTH && window.fromYmd && window.toYmd) {
    bars = barsForMonth(current.byDay, window.fromYmd, window.toYmd);
  } else if (range === REVENUE_RANGE.YEAR) {
    bars = barsForYear(current.byDay, now.getFullYear());
  } else {
    bars = barsForAllTime(current.byDay);
  }

  let changePct = null;
  /** @type {string | null} */
  let compareLabel = null;
  if (range === REVENUE_RANGE.WEEK) {
    changePct = changePercent(current.collectedCents, previous.collectedCents);
    compareLabel = changePct == null ? null : 'vs last week';
  } else if (range === REVENUE_RANGE.MONTH) {
    changePct = changePercent(current.collectedCents, previous.collectedCents);
    compareLabel = changePct == null ? null : 'vs last month';
  } else if (range === REVENUE_RANGE.YEAR) {
    changePct = changePercent(current.collectedCents, previous.collectedCents);
    compareLabel = changePct == null ? null : 'vs last year';
  }

  return {
    collectedCents: current.collectedCents,
    jobsPaid: current.jobsPaid,
    changePct,
    compareLabel,
    bars,
  };
}
