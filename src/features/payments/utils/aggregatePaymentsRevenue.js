import { calendarYyyyMmDdFromScheduledDate, localYyyyMmDd } from '../../home/utils/bookingStart';
import { computeBookingEarningsCents } from '../../home/utils/todaysEarnings';
import {
  REVENUE_CUSTOM_DAILY_MAX_DAYS,
  REVENUE_CUSTOM_WEEKLY_MAX_DAYS,
  REVENUE_RANGE,
} from '../constants/paymentsRevenueRanges';
import {
  addDays,
  inclusiveDayCount,
  parseLocalYmd,
  revenueCustomDateWindow,
  revenueDateWindow,
} from './revenueDateWindows';

/**
 * @typedef {{ label: string; fullLabel: string; cents: number; key: string }} RevenueBar
 * @typedef {{
 *   collectedCents: number;
 *   jobsPaid: number;
 *   changePct: number | null;
 *   compareLabel: string | null;
 *   bars: RevenueBar[];
 *   bucketKind: 'daily' | 'weekly' | 'monthly' | 'yearly';
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
 * @param {string} fromYmd
 * @param {string} toYmd
 * @returns {'daily' | 'weekly' | 'monthly'}
 */
function customBucketKind(fromYmd, toYmd) {
  const days = inclusiveDayCount(fromYmd, toYmd);
  if (days <= REVENUE_CUSTOM_DAILY_MAX_DAYS) return 'daily';
  if (days <= REVENUE_CUSTOM_WEEKLY_MAX_DAYS) return 'weekly';
  return 'monthly';
}

/**
 * @param {Date} from
 * @param {Date} to
 * @returns {string}
 */
function customChunkFullLabel(from, to) {
  const fromLabel = `${MONTH_SHORT[from.getMonth()]} ${from.getDate()}`;
  if (localYyyyMmDd(from) === localYyyyMmDd(to)) return fromLabel;
  if (from.getFullYear() === to.getFullYear() && from.getMonth() === to.getMonth()) {
    return `${fromLabel}–${to.getDate()}`;
  }
  if (from.getFullYear() === to.getFullYear()) {
    return `${fromLabel}–${MONTH_SHORT[to.getMonth()]} ${to.getDate()}`;
  }
  return `${fromLabel}, ${from.getFullYear()}–${MONTH_SHORT[to.getMonth()]} ${to.getDate()}, ${to.getFullYear()}`;
}

/**
 * @param {Map<string, number>} byDay
 * @param {string} fromYmd
 * @param {string} toYmd
 * @returns {RevenueBar[]}
 */
function barsForCustomDays(byDay, fromYmd, toYmd) {
  const start = parseLocalYmd(fromYmd);
  const end = parseLocalYmd(toYmd);
  const sameMonth =
    start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth();
  /** @type {RevenueBar[]} */
  const bars = [];
  let cursor = start;
  while (cursor.getTime() <= end.getTime()) {
    const ymd = localYyyyMmDd(cursor);
    const weekday = cursor.getDay();
    const monthShort = MONTH_SHORT[cursor.getMonth()];
    const dayNum = cursor.getDate();
    bars.push({
      key: ymd,
      label: sameMonth ? String(dayNum) : `${monthShort} ${dayNum}`,
      fullLabel: `${WEEKDAY_MED[weekday]}, ${monthShort} ${dayNum}`,
      cents: byDay.get(ymd) ?? 0,
    });
    cursor = addDays(cursor, 1);
  }
  return bars;
}

/**
 * Consecutive 7-day chunks from the custom start (last chunk may be shorter).
 *
 * @param {Map<string, number>} byDay
 * @param {string} fromYmd
 * @param {string} toYmd
 * @returns {RevenueBar[]}
 */
function barsForCustomWeeks(byDay, fromYmd, toYmd) {
  /** @type {RevenueBar[]} */
  const bars = [];
  let cursor = parseLocalYmd(fromYmd);
  const end = parseLocalYmd(toYmd);
  let weekIndex = 1;
  while (cursor.getTime() <= end.getTime()) {
    const chunkEnd = addDays(cursor, 6);
    const to = chunkEnd.getTime() > end.getTime() ? end : chunkEnd;
    const fromKey = localYyyyMmDd(cursor);
    const toKey = localYyyyMmDd(to);
    bars.push({
      key: `cw${weekIndex}-${fromKey}`,
      label: `${MONTH_SHORT[cursor.getMonth()]} ${cursor.getDate()}`,
      fullLabel: customChunkFullLabel(cursor, to),
      cents: sumDaysInRange(byDay, fromKey, toKey),
    });
    cursor = addDays(to, 1);
    weekIndex += 1;
  }
  return bars;
}

/**
 * @param {Map<string, number>} byDay
 * @param {string} fromYmd
 * @param {string} toYmd
 * @returns {RevenueBar[]}
 */
function barsForCustomMonths(byDay, fromYmd, toYmd) {
  const start = parseLocalYmd(fromYmd);
  const end = parseLocalYmd(toYmd);
  const showYear = start.getFullYear() !== end.getFullYear();
  /** @type {RevenueBar[]} */
  const bars = [];
  let year = start.getFullYear();
  let month = start.getMonth();

  while (year < end.getFullYear() || (year === end.getFullYear() && month <= end.getMonth())) {
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    const from = monthStart.getTime() < start.getTime() ? start : monthStart;
    const to = monthEnd.getTime() > end.getTime() ? end : monthEnd;
    bars.push({
      key: `${year}-${month + 1}`,
      label: showYear ? `${MONTH_SHORT[month]} ${String(year).slice(2)}` : MONTH_SHORT[month],
      fullLabel: `${MONTH_LONG[month]} ${year}`,
      cents: sumDaysInRange(byDay, localYyyyMmDd(from), localYyyyMmDd(to)),
    });
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }
  return bars;
}

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
 *   fromYmd?: string | null;
 *   toYmd?: string | null;
 * }} args
 * @returns {PaymentsRevenueSummary}
 */
export function aggregatePaymentsRevenue({
  range,
  currentRows,
  previousRows = [],
  now = new Date(),
  fromYmd = null,
  toYmd = null,
}) {
  const window =
    range === REVENUE_RANGE.CUSTOM
      ? revenueCustomDateWindow(fromYmd, toYmd)
      : revenueDateWindow(range, now);
  const current = summarizeCompletedRows(currentRows);
  const previous = summarizeCompletedRows(previousRows);

  /** @type {RevenueBar[]} */
  let bars = [];
  /** @type {'daily' | 'weekly' | 'monthly' | 'yearly'} */
  let bucketKind = 'yearly';

  if (range === REVENUE_RANGE.CUSTOM && window.fromYmd && window.toYmd) {
    bucketKind = customBucketKind(window.fromYmd, window.toYmd);
    if (bucketKind === 'daily') {
      bars = barsForCustomDays(current.byDay, window.fromYmd, window.toYmd);
    } else if (bucketKind === 'weekly') {
      bars = barsForCustomWeeks(current.byDay, window.fromYmd, window.toYmd);
    } else {
      bars = barsForCustomMonths(current.byDay, window.fromYmd, window.toYmd);
    }
  } else if (range === REVENUE_RANGE.WEEK && window.fromYmd && window.toYmd) {
    bucketKind = 'daily';
    bars = barsForWeek(current.byDay, window.fromYmd, window.toYmd);
  } else if (range === REVENUE_RANGE.MONTH && window.fromYmd && window.toYmd) {
    bucketKind = 'weekly';
    bars = barsForMonth(current.byDay, window.fromYmd, window.toYmd);
  } else if (range === REVENUE_RANGE.YEAR) {
    bucketKind = 'monthly';
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
  } else if (range === REVENUE_RANGE.CUSTOM && window.fromYmd && window.toYmd) {
    changePct = changePercent(current.collectedCents, previous.collectedCents);
    compareLabel = changePct == null ? null : 'vs prior period';
  }

  return {
    collectedCents: current.collectedCents,
    jobsPaid: current.jobsPaid,
    changePct,
    compareLabel,
    bars,
    bucketKind,
  };
}
