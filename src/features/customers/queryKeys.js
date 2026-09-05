/** @type {const} */
export const CUSTOMERS_QUERY_ROOT = ['customers'];

export function customersListQueryKey(businessId) {
  return [...CUSTOMERS_QUERY_ROOT, 'list', businessId ?? 'none'];
}

export function customerDetailsQueryKey(businessId, customerId) {
  return [...CUSTOMERS_QUERY_ROOT, 'detail', businessId ?? 'none', customerId ?? 'none'];
}

export function customersApiQueryKey(businessId) {
  return [...CUSTOMERS_QUERY_ROOT, 'api', businessId ?? 'none'];
}

export function customerLookupQueryKey(businessId, phone, email) {
  return [...CUSTOMERS_QUERY_ROOT, 'lookup', businessId ?? 'none', phone ?? '', email ?? ''];
}

export function customerAssetsQueryKey(businessId, customerId) {
  return [...CUSTOMERS_QUERY_ROOT, 'assets', businessId ?? 'none', customerId ?? 'none'];
}
