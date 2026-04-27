/** @type {const} */
export const AVAILABILITY_QUERY_ROOT = ['availability'];

export function businessAvailabilityQueryKey(businessId) {
  return [...AVAILABILITY_QUERY_ROOT, 'business', businessId ?? 'none'];
}
