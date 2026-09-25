import { customDateWindow, startOfLocalDay, toLocalYyyyMmDd } from '../../../components/ui';
import { EXPENSE_RANGE } from '../constants/expenseRanges';

function clampDay(year, month, day) {
  const last = new Date(year, month + 1, 0).getDate();
  return Math.min(day, last);
}

function earliestChargedOn(expenses) {
  const dates = (expenses ?? [])
    .map((item) => String(item?.chargedOn ?? '').trim())
    .filter(Boolean)
    .sort();
  return dates[0] ?? null;
}

/** Sunday-start week, matching the in-app calendar. */
export function startOfWeekSunday(date) {
  const start = startOfLocalDay(date);
  start.setDate(start.getDate() - start.getDay());
  return start;
}

/**
 * Inclusive `YYYY-MM-DD` window for a period.
 * Totals run through today. Charts may still draw the rest of the period empty.
 *
 * @param {string} range
 * @param {Date} [now]
 * @param {Array<{ chargedOn?: string }>} [expenses]
 * @param {{ fromYmd?: string | null; toYmd?: string | null }} [custom]
 */
export function expenseRangeWindow(range, now = new Date(), expenses = [], custom = {}) {
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = toLocalYyyyMmDd(now);

  if (range === EXPENSE_RANGE.CUSTOM) {
    const window = customDateWindow(custom.fromYmd, custom.toYmd);
    if (window.fromYmd && window.toYmd) {
      return { fromYmd: window.fromYmd, toYmd: window.toYmd };
    }
    return { fromYmd: today, toYmd: today };
  }

  if (range === EXPENSE_RANGE.WEEK) {
    return { fromYmd: toLocalYyyyMmDd(startOfWeekSunday(now)), toYmd: today };
  }

  if (range === EXPENSE_RANGE.YEAR) {
    return { fromYmd: `${year}-01-01`, toYmd: today };
  }

  if (range === EXPENSE_RANGE.ALL) {
    return { fromYmd: earliestChargedOn(expenses) ?? today, toYmd: today };
  }

  return {
    fromYmd: toLocalYyyyMmDd(new Date(year, month, 1)),
    toYmd: today,
  };
}

/**
 * Prior period of the same shape, for “vs last week / month / year”.
 * All-time has no prior window.
 *
 * @param {string} range
 * @param {Date} [now]
 * @param {{ fromYmd?: string | null; toYmd?: string | null }} [custom]
 * @returns {{ fromYmd: string; toYmd: string } | null}
 */
export function expensePriorWindow(range, now = new Date(), custom = {}) {
  if (range === EXPENSE_RANGE.ALL) return null;

  if (range === EXPENSE_RANGE.CUSTOM) {
    const window = customDateWindow(custom.fromYmd, custom.toYmd);
    if (!window.prevFromYmd || !window.prevToYmd) return null;
    return { fromYmd: window.prevFromYmd, toYmd: window.prevToYmd };
  }

  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();

  if (range === EXPENSE_RANGE.WEEK) {
    const thisStart = startOfWeekSunday(now);
    const priorStart = new Date(thisStart);
    priorStart.setDate(priorStart.getDate() - 7);
    const priorEnd = new Date(thisStart);
    priorEnd.setDate(priorEnd.getDate() - 1);
    return { fromYmd: toLocalYyyyMmDd(priorStart), toYmd: toLocalYyyyMmDd(priorEnd) };
  }

  if (range === EXPENSE_RANGE.YEAR) {
    return {
      fromYmd: `${year - 1}-01-01`,
      toYmd: toLocalYyyyMmDd(new Date(year - 1, month, clampDay(year - 1, month, day))),
    };
  }

  const priorYear = month === 0 ? year - 1 : year;
  const priorMonth = month === 0 ? 11 : month - 1;
  return {
    fromYmd: toLocalYyyyMmDd(new Date(priorYear, priorMonth, 1)),
    toYmd: toLocalYyyyMmDd(new Date(priorYear, priorMonth, clampDay(priorYear, priorMonth, day))),
  };
}

export function expenseInWindow(chargedOn, fromYmd, toYmd) {
  const key = String(chargedOn ?? '').trim();
  if (!key) return false;
  return key >= fromYmd && key <= toYmd;
}

export function filterExpensesByWindow(expenses, fromYmd, toYmd) {
  return (expenses ?? []).filter((item) => expenseInWindow(item?.chargedOn, fromYmd, toYmd));
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
 * Calendar frame shown next to the chart — full week / month / year, like Payments.
 *
 * @param {string} range
 * @param {Date} [now]
 * @param {Array<{ chargedOn?: string }>} [expenses]
 * @param {{ fromYmd?: string | null; toYmd?: string | null }} [custom]
 */
export function expenseCaptionWindow(range, now = new Date(), expenses = [], custom = {}) {
  const year = now.getFullYear();
  const month = now.getMonth();

  if (range === EXPENSE_RANGE.CUSTOM) {
    return expenseRangeWindow(range, now, expenses, custom);
  }

  if (range === EXPENSE_RANGE.WEEK) {
    const start = startOfWeekSunday(now);
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
    return { fromYmd: toLocalYyyyMmDd(start), toYmd: toLocalYyyyMmDd(end) };
  }

  if (range === EXPENSE_RANGE.YEAR) {
    return { fromYmd: `${year}-01-01`, toYmd: `${year}-12-31` };
  }

  if (range === EXPENSE_RANGE.ALL) {
    return expenseRangeWindow(range, now, expenses);
  }

  return {
    fromYmd: toLocalYyyyMmDd(new Date(year, month, 1)),
    toYmd: toLocalYyyyMmDd(new Date(year, month + 1, 0)),
  };
}

/**
 * Caption under the range picker: "Sep 6 – Sep 12".
 *
 * @param {string | null | undefined} fromYmd
 * @param {string | null | undefined} toYmd
 */
export function formatExpenseWindowCaption(fromYmd, toYmd) {
  const fromKey = String(fromYmd ?? '').trim();
  const toKey = String(toYmd ?? '').trim();
  if (!fromKey || !toKey) return null;

  const from = new Date(
    Number(fromKey.slice(0, 4)),
    Number(fromKey.slice(5, 7)) - 1,
    Number(fromKey.slice(8, 10)),
  );
  const to = new Date(
    Number(toKey.slice(0, 4)),
    Number(toKey.slice(5, 7)) - 1,
    Number(toKey.slice(8, 10)),
  );
  const monthDay = (d) => `${MONTH_SHORT[d.getMonth()]} ${d.getDate()}`;
  if (from.getFullYear() !== to.getFullYear()) {
    return `${monthDay(from)}, ${from.getFullYear()} – ${monthDay(to)}, ${to.getFullYear()}`;
  }
  return `${monthDay(from)} – ${monthDay(to)}`;
}

/**
 * Rows the overview needs: this period plus the prior period used for the change pill.
 * All-time has no bound — callers should load every expense for the business.
 *
 * @param {string} range
 * @param {Date} [now]
 * @param {{ fromYmd?: string | null; toYmd?: string | null }} [custom]
 * @returns {{ fromYmd: string; toYmd: string } | null}
 */
export function expenseOverviewFetchWindow(range, now = new Date(), custom = {}) {
  if (range === EXPENSE_RANGE.ALL) return null;
  const current = expenseRangeWindow(range, now, [], custom);
  const prior = expensePriorWindow(range, now, custom);
  const fromYmd = prior && prior.fromYmd < current.fromYmd ? prior.fromYmd : current.fromYmd;
  const toYmd = prior && prior.toYmd > current.toYmd ? prior.toYmd : current.toYmd;
  return { fromYmd, toYmd };
}
