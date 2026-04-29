/** @type {const} */
export const PAYMENTS_QUERY_ROOT = ['payments'];

export function paymentsDashboardQueryKey(businessId) {
  return [...PAYMENTS_QUERY_ROOT, 'dashboard', businessId ?? 'none'];
}
