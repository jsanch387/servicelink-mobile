/** @type {const} */
export const EXPENSES_QUERY_ROOT = ['expenses'];

export function expensesOverviewQueryKey(businessId, range, fromYmd, toYmd) {
  return [
    ...EXPENSES_QUERY_ROOT,
    'overview',
    businessId ?? 'none',
    range ?? 'month',
    fromYmd ?? 'all',
    toYmd ?? 'all',
  ];
}

export function expensesListQueryKey(businessId) {
  return [...EXPENSES_QUERY_ROOT, 'list', businessId ?? 'none'];
}
