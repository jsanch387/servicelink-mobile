/** @type {const} */
export const SERVICES_QUERY_ROOT = ['services'];

export function servicesCatalogQueryKey(businessId) {
  return [...SERVICES_QUERY_ROOT, 'catalog', businessId ?? 'none'];
}

export function serviceEditorQueryKey(businessId, serviceId) {
  return [...SERVICES_QUERY_ROOT, 'editor', businessId ?? 'none', serviceId ?? 'none'];
}

/** Invalidate all `serviceEditorQueryKey(businessId, *)` rows for one business (e.g. global add-on catalog changed). */
export function serviceEditorAllServicesQueryKey(businessId) {
  return [...SERVICES_QUERY_ROOT, 'editor', businessId ?? 'none'];
}
