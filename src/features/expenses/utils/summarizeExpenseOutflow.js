import { EXPENSE_CATEGORY_OPTIONS, normalizeExpenseCategory } from '../constants/expenseCategories';
import {
  EXPENSE_RANGE,
  expenseRangeCaption,
  expenseRangeCompareName,
} from '../constants/expenseRanges';
import { buildExpenseChartBars } from './expenseChartBuckets';
import { sumExpenseAmounts } from './expenseMoney';
import {
  expenseCaptionWindow,
  expensePriorWindow,
  expenseRangeWindow,
  filterExpensesByWindow,
  formatExpenseWindowCaption,
} from './expenseWindows';

function buildCategoryBreakdown(expenses) {
  const totals = new Map(EXPENSE_CATEGORY_OPTIONS.map((option) => [option.key, 0]));
  for (const item of expenses) {
    const key = normalizeExpenseCategory(item?.category);
    totals.set(key, (totals.get(key) ?? 0) + (Number(item?.amount) || 0));
  }
  return EXPENSE_CATEGORY_OPTIONS.map((option) => ({
    key: option.key,
    label: option.label,
    amount: totals.get(option.key) ?? 0,
  }))
    .filter((row) => row.amount > 0)
    .sort((a, b) => b.amount - a.amount);
}

function percentChange(current, prior) {
  if (!Number.isFinite(prior) || prior <= 0) return null;
  return Math.round(((current - prior) / prior) * 100);
}

function formatChangeSentence(changePct, compareName) {
  if (changePct == null || !compareName) return '';
  if (changePct === 0) return `Same as ${compareName}`;
  const direction = changePct > 0 ? 'more' : 'less';
  return `${Math.abs(changePct)}% ${direction} than ${compareName}`;
}

/**
 * Overview story for the selected Week / Month / Year / All time filter.
 *
 * @param {Array<object>} expenses
 * @param {string} range
 * @param {Date} [now]
 * @param {{
 *   customFromYmd?: string | null;
 *   customToYmd?: string | null;
 * }} [options]
 */
export function summarizeExpenseOutflow(
  expenses,
  range = EXPENSE_RANGE.MONTH,
  now = new Date(),
  options = {},
) {
  const custom = { fromYmd: options.customFromYmd, toYmd: options.customToYmd };
  const window = expenseRangeWindow(range, now, expenses, custom);
  const prior = expensePriorWindow(range, now, custom);
  const yearWindow = expenseRangeWindow(EXPENSE_RANGE.YEAR, now, expenses);
  const inRange = filterExpensesByWindow(expenses, window.fromYmd, window.toYmd);
  const inPrior = prior ? filterExpensesByWindow(expenses, prior.fromYmd, prior.toYmd) : [];
  const yearItems = filterExpensesByWindow(expenses, yearWindow.fromYmd, yearWindow.toYmd);
  const total = sumExpenseAmounts(inRange);
  const priorTotal = sumExpenseAmounts(inPrior);
  const changePct = prior ? percentChange(total, priorTotal) : null;
  const compareName = prior ? expenseRangeCompareName(range) : '';
  const captionWindow = expenseCaptionWindow(range, now, expenses, custom);

  return {
    range,
    total,
    caption: expenseRangeCaption(range),
    windowCaption: formatExpenseWindowCaption(captionWindow.fromYmd, captionWindow.toYmd),
    changeSentence: formatChangeSentence(changePct, compareName),
    compareLabel: changePct == null || !compareName ? null : `vs ${compareName}`,
    changePct,
    yearToDate: sumExpenseAmounts(yearItems),
    showYearToDate:
      range !== EXPENSE_RANGE.YEAR && range !== EXPENSE_RANGE.ALL && range !== EXPENSE_RANGE.CUSTOM,
    categories: buildCategoryBreakdown(inRange),
    bars: buildExpenseChartBars(expenses, range, now, custom),
  };
}
