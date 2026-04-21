/** @type {const} */
export const CUSTOMERS_QUERY_ROOT = ['customers'];

export function customersListQueryKey(businessId) {
  return [...CUSTOMERS_QUERY_ROOT, 'list', businessId ?? 'none'];
}
