/** @type {const} */
export const BOOKING_LINK_QUERY_KEY = ['booking-link'];

export function bookingLinkOwnerProfileQueryKey(userId) {
  return [...BOOKING_LINK_QUERY_KEY, 'owner-profile', userId ?? ''];
}

export function bookingLinkPublicProfileQueryKey(slug) {
  return [...BOOKING_LINK_QUERY_KEY, 'public-profile', slug ?? ''];
}
