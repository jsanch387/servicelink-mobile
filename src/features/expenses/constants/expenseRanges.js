export const EXPENSE_RANGE = {
  WEEK: 'week',
  MONTH: 'month',
  YEAR: 'year',
  ALL: 'all',
  CUSTOM: 'custom',
};

export const EXPENSE_RANGE_FILTERS = [
  { key: EXPENSE_RANGE.WEEK, label: 'Week' },
  { key: EXPENSE_RANGE.MONTH, label: 'Month' },
  { key: EXPENSE_RANGE.YEAR, label: 'Year' },
  { key: EXPENSE_RANGE.ALL, label: 'All time' },
  { key: EXPENSE_RANGE.CUSTOM, label: 'Custom' },
];

export const EXPENSE_RANGE_DEFAULT = EXPENSE_RANGE.MONTH;

export function expenseRangeCaption(range) {
  if (range === EXPENSE_RANGE.WEEK) return 'This week';
  if (range === EXPENSE_RANGE.YEAR) return 'This year';
  if (range === EXPENSE_RANGE.ALL) return 'All time';
  if (range === EXPENSE_RANGE.CUSTOM) return 'Custom';
  return 'This month';
}

export function expenseRangeCompareName(range) {
  if (range === EXPENSE_RANGE.WEEK) return 'last week';
  if (range === EXPENSE_RANGE.YEAR) return 'last year';
  if (range === EXPENSE_RANGE.ALL) return '';
  if (range === EXPENSE_RANGE.CUSTOM) return 'prior period';
  return 'last month';
}
