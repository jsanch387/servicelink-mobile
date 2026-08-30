/** @type {const} */
export const SERVICE_AREA_QUERY_KEY = ['business-service-area'];

export function primaryServiceAreaQueryKey(businessProfileId) {
  return [...SERVICE_AREA_QUERY_KEY, 'primary', businessProfileId ?? ''];
}
