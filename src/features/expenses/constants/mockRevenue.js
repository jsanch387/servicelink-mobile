import { inclusiveDayCount } from '../../../components/ui';
import { EXPENSE_RANGE } from './expenseRanges';

const MOCK_CUSTOM_DOLLARS_PER_DAY = 95;

/**
 * Local stand-in for completed-job revenue in the selected window.
 * Swap for Payments totals when expenses go live.
 */
export const MOCK_REVENUE_BY_RANGE = {
  [EXPENSE_RANGE.WEEK]: 820,
  [EXPENSE_RANGE.MONTH]: 2840,
  [EXPENSE_RANGE.YEAR]: 18600,
  [EXPENSE_RANGE.ALL]: 24200,
};

export function mockRevenueForRange(range, { fromYmd, toYmd } = {}) {
  if (range === EXPENSE_RANGE.CUSTOM) {
    const days = inclusiveDayCount(fromYmd, toYmd);
    if (days <= 0) return MOCK_REVENUE_BY_RANGE[EXPENSE_RANGE.MONTH];
    return Math.round(MOCK_CUSTOM_DOLLARS_PER_DAY * days);
  }
  return MOCK_REVENUE_BY_RANGE[range] ?? MOCK_REVENUE_BY_RANGE[EXPENSE_RANGE.MONTH];
}
