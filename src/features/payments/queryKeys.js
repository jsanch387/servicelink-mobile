/** @type {const} */
export const PAYMENTS_QUERY_ROOT = ['payments'];

export function paymentsDashboardQueryKey(businessId) {
  return [...PAYMENTS_QUERY_ROOT, 'dashboard', businessId ?? 'none'];
}

export function paymentsRevenueQueryKey(businessId, range, fromYmd = null, toYmd = null) {
  return [
    ...PAYMENTS_QUERY_ROOT,
    'revenue',
    businessId ?? 'none',
    range ?? 'month',
    fromYmd ?? 'open',
    toYmd ?? 'open',
  ];
}
