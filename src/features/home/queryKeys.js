/** @type {const} */
export const HOME_QUERY_KEY = ['home'];

export function homeBusinessProfileQueryKey(userId) {
  return [...HOME_QUERY_KEY, 'business-profile', userId ?? ''];
}

export function homeBookingsUpcomingQueryKey(businessId) {
  return [...HOME_QUERY_KEY, 'bookings-upcoming', businessId ?? 'none'];
}

export function homeBookingsTodayQueryKey(businessId) {
  return [...HOME_QUERY_KEY, 'bookings-today', businessId ?? 'none'];
}
