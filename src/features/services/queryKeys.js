/** @type {const} */
export const SERVICES_QUERY_ROOT = ['services'];

export function servicesCatalogQueryKey(businessId) {
  return [...SERVICES_QUERY_ROOT, 'catalog', businessId ?? 'none'];
}
