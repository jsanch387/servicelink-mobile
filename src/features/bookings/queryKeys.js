/** @type {const} */
export const BOOKINGS_QUERY_ROOT = ['bookings'];

/**
 * @param {string | undefined} businessId
 * @param {string} filter - `upcoming` | `past` | `cancelled`
 */
export function bookingsListQueryKey(businessId, filter) {
  return [...BOOKINGS_QUERY_ROOT, 'list', filter, businessId ?? 'none'];
}

/**
 * @param {string | undefined} businessId
 * @param {string} yyyyMmDd
 */
export function bookingsPlannerDayQueryKey(businessId, yyyyMmDd) {
  return [...BOOKINGS_QUERY_ROOT, 'plannerDay', businessId ?? 'none', yyyyMmDd];
}
