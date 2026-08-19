export const MEMBERSHIPS_QUERY_ROOT = ['memberships'];

/**
 * @param {string | null | undefined} businessId
 */
export function membershipCatalogQueryKey(businessId) {
  return [...MEMBERSHIPS_QUERY_ROOT, 'catalog', businessId ?? 'none'];
}

/**
 * @param {string | null | undefined} bookingId
 */
export function membershipVisitForBookingQueryKey(bookingId) {
  return [...MEMBERSHIPS_QUERY_ROOT, 'visitForBooking', bookingId ?? 'none'];
}
