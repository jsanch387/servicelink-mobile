import {
  CHART_MONTH_SHORT,
  chartMonthTick,
  chartMonthTooltip,
  inclusiveDayCount,
  parseLocalYyyyMmDd,
  toLocalYyyyMmDd,
} from '../../../components/ui';
import { EXPENSE_RANGE } from '../constants/expenseRanges';
import { startOfWeekSunday } from './expenseWindows';

const CUSTOM_DAILY_MAX_DAYS = 31;
const CUSTOM_WEEKLY_MAX_DAYS = 180;

const WEEKDAY_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const WEEKDAY_MED = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const ALL_TIME_YEARLY_MIN_YEARS = 3;

function addLocalDays(date, days) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function addAmount(map, key, amount) {
  map.set(key, (map.get(key) ?? 0) + (Number(amount) || 0));
}

function sumByChargedOn(expenses) {
  const totals = new Map();
  for (const item of expenses ?? []) {
    const key = String(item?.chargedOn ?? '').trim();
    if (!key) continue;
    addAmount(totals, key, item?.amount);
  }
  return totals;
}

function monthDayLabel(date) {
  return `${chartMonthTick(date.getMonth())} ${date.getDate()}`;
}

function rangeFullLabel(from, to) {
  const fromLabel = monthDayLabel(from);
  if (toLocalYyyyMmDd(from) === toLocalYyyyMmDd(to)) return fromLabel;
  if (from.getFullYear() === to.getFullYear() && from.getMonth() === to.getMonth()) {
    return `${fromLabel}–${to.getDate()}`;
  }
  if (from.getFullYear() === to.getFullYear()) {
    return `${fromLabel}–${monthDayLabel(to)}`;
  }
  return `${fromLabel}, ${from.getFullYear()}–${monthDayLabel(to)}, ${to.getFullYear()}`;
}

function sumDaysInRange(totals, fromYmd, toYmd) {
  let amount = 0;
  for (const [key, value] of totals) {
    if (key >= fromYmd && key <= toYmd) amount += value;
  }
  return amount;
}

function buildWeekBars(now, totals) {
  const start = startOfWeekSunday(now);
  const bars = [];
  for (let i = 0; i < 7; i += 1) {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const key = toLocalYyyyMmDd(date);
    bars.push({
      key,
      label: WEEKDAY_SHORT[date.getDay()],
      fullLabel: `${WEEKDAY_MED[date.getDay()]}, ${monthDayLabel(date)}`,
      amount: totals.get(key) ?? 0,
    });
  }
  return bars;
}

function buildMonthBars(now, totals) {
  const year = now.getFullYear();
  const month = now.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const segments = [
    { startDay: 1, endDay: Math.min(7, lastDay) },
    { startDay: 8, endDay: Math.min(14, lastDay) },
    { startDay: 15, endDay: Math.min(21, lastDay) },
    { startDay: 22, endDay: lastDay },
  ].filter((seg) => seg.startDay <= lastDay);

  return segments.map(({ startDay, endDay }, index) => {
    const from = new Date(year, month, startDay);
    const to = new Date(year, month, endDay);
    return {
      key: `${year}-${month + 1}-w${index + 1}`,
      label: `Wk ${index + 1}`,
      fullLabel: rangeFullLabel(from, to),
      amount: sumDaysInRange(totals, toLocalYyyyMmDd(from), toLocalYyyyMmDd(to)),
    };
  });
}

function buildYearBars(now, totals) {
  const year = now.getFullYear();
  return CHART_MONTH_SHORT.map((label, monthIndex) => {
    const from = new Date(year, monthIndex, 1);
    const to = new Date(year, monthIndex + 1, 0);
    return {
      key: `${year}-${monthIndex + 1}`,
      label,
      fullLabel: chartMonthTooltip(monthIndex, year),
      amount: sumDaysInRange(totals, toLocalYyyyMmDd(from), toLocalYyyyMmDd(to)),
    };
  });
}

function buildYearlyBars(startYear, endYear, totals) {
  const bars = [];
  for (let year = startYear; year <= endYear; year += 1) {
    bars.push({
      key: String(year),
      label: String(year),
      fullLabel: String(year),
      amount: sumDaysInRange(totals, `${year}-01-01`, `${year}-12-31`),
    });
  }
  return bars;
}

function buildMonthSpanBars(fromYmd, toYmd, totals) {
  const startYear = Number(fromYmd.slice(0, 4));
  const startMonth = Number(fromYmd.slice(5, 7)) - 1;
  const endYear = Number(toYmd.slice(0, 4));
  const endMonth = Number(toYmd.slice(5, 7)) - 1;
  const bars = [];
  let year = startYear;
  let month = startMonth;

  while (year < endYear || (year === endYear && month <= endMonth)) {
    const from = new Date(year, month, 1);
    const to = new Date(year, month + 1, 0);
    bars.push({
      key: `${year}-${month + 1}`,
      label: chartMonthTick(month),
      fullLabel: chartMonthTooltip(month, year),
      amount: sumDaysInRange(totals, toLocalYyyyMmDd(from), toLocalYyyyMmDd(to)),
    });
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }
  return bars;
}

function customBucketKind(fromYmd, toYmd) {
  const days = inclusiveDayCount(fromYmd, toYmd);
  if (days <= CUSTOM_DAILY_MAX_DAYS) return 'daily';
  if (days <= CUSTOM_WEEKLY_MAX_DAYS) return 'weekly';
  return 'monthly';
}

function buildCustomDayBars(totals, fromYmd, toYmd) {
  const start = parseLocalYyyyMmDd(fromYmd);
  const end = parseLocalYyyyMmDd(toYmd);
  if (!start || !end) return [];
  const sameMonth =
    start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth();
  const bars = [];
  let cursor = start;
  while (cursor.getTime() <= end.getTime()) {
    const key = toLocalYyyyMmDd(cursor);
    bars.push({
      key,
      label: sameMonth ? String(cursor.getDate()) : monthDayLabel(cursor),
      fullLabel: `${WEEKDAY_MED[cursor.getDay()]}, ${monthDayLabel(cursor)}`,
      amount: totals.get(key) ?? 0,
    });
    cursor = addLocalDays(cursor, 1);
  }
  return bars;
}

function buildCustomWeekBars(totals, fromYmd, toYmd) {
  const start = parseLocalYyyyMmDd(fromYmd);
  const end = parseLocalYyyyMmDd(toYmd);
  if (!start || !end) return [];
  const bars = [];
  let cursor = start;
  let weekIndex = 1;
  while (cursor.getTime() <= end.getTime()) {
    const chunkEnd = addLocalDays(cursor, 6);
    const to = chunkEnd.getTime() > end.getTime() ? end : chunkEnd;
    bars.push({
      key: `cw${weekIndex}-${toLocalYyyyMmDd(cursor)}`,
      label: monthDayLabel(cursor),
      fullLabel: rangeFullLabel(cursor, to),
      amount: sumDaysInRange(totals, toLocalYyyyMmDd(cursor), toLocalYyyyMmDd(to)),
    });
    cursor = addLocalDays(to, 1);
    weekIndex += 1;
  }
  return bars;
}

function buildCustomMonthBars(totals, fromYmd, toYmd) {
  const start = parseLocalYyyyMmDd(fromYmd);
  const end = parseLocalYyyyMmDd(toYmd);
  if (!start || !end) return [];
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
      label: chartMonthTick(month),
      fullLabel: chartMonthTooltip(month, year),
      amount: sumDaysInRange(totals, toLocalYyyyMmDd(from), toLocalYyyyMmDd(to)),
    });
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }
  return bars;
}

function buildCustomBars(totals, fromYmd, toYmd) {
  const kind = customBucketKind(fromYmd, toYmd);
  if (kind === 'daily') return buildCustomDayBars(totals, fromYmd, toYmd);
  if (kind === 'weekly') return buildCustomWeekBars(totals, fromYmd, toYmd);
  return buildCustomMonthBars(totals, fromYmd, toYmd);
}

function buildAllTimeBars(now, totals) {
  const keys = [...totals.keys()].sort();
  const currentYear = now.getFullYear();
  if (keys.length === 0) {
    return [
      {
        key: String(currentYear),
        label: String(currentYear),
        fullLabel: String(currentYear),
        amount: 0,
      },
    ];
  }

  const startYear = Number(keys[0].slice(0, 4));
  if (!Number.isFinite(startYear)) {
    return [
      {
        key: String(currentYear),
        label: String(currentYear),
        fullLabel: String(currentYear),
        amount: 0,
      },
    ];
  }

  if (currentYear - startYear + 1 >= ALL_TIME_YEARLY_MIN_YEARS) {
    return buildYearlyBars(startYear, currentYear, totals);
  }

  return buildMonthSpanBars(keys[0], toLocalYyyyMmDd(now), totals);
}

/**
 * Chart buckets matching Payments revenue: weekdays, Wk 1–4, months, then years.
 *
 * @param {Array<object>} expenses
 * @param {string} range
 * @param {Date} [now]
 * @param {{ fromYmd?: string | null; toYmd?: string | null }} [custom]
 */
export function buildExpenseChartBars(expenses, range, now = new Date(), custom = {}) {
  const totals = sumByChargedOn(expenses);
  if (range === EXPENSE_RANGE.CUSTOM && custom.fromYmd && custom.toYmd) {
    return buildCustomBars(totals, custom.fromYmd, custom.toYmd);
  }
  if (range === EXPENSE_RANGE.WEEK) return buildWeekBars(now, totals);
  if (range === EXPENSE_RANGE.YEAR) return buildYearBars(now, totals);
  if (range === EXPENSE_RANGE.ALL) return buildAllTimeBars(now, totals);
  return buildMonthBars(now, totals);
}
