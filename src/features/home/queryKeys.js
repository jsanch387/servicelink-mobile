/** @type {const} */
export const HOME_QUERY_KEY = ['home'];

export function homeBusinessProfileQueryKey(userId) {
  return [...HOME_QUERY_KEY, 'business-profile', userId ?? ''];
}

export function homeBookingsUpcomingQueryKey(businessId) {
  return [...HOME_QUERY_KEY, 'bookings-upcoming', businessId ?? 'none'];
}

/**
 * @param {string | null | undefined} businessId
 * @param {string | null | undefined} calendarYyyyMmDd - device-local calendar day; omit for prefix invalidation only
 */
export function homeBookingsTodayQueryKey(businessId, calendarYyyyMmDd) {
  const base = [...HOME_QUERY_KEY, 'bookings-today', businessId ?? 'none'];
  if (calendarYyyyMmDd != null && String(calendarYyyyMmDd).trim() !== '') {
    return [...base, String(calendarYyyyMmDd).trim()];
  }
  return base;
}

/**
 * @param {string | null | undefined} businessId
 * @param {'24h' | '7d' | '30d'} period — effective period used for the count query
 */
export function homeLinkViewsCountQueryKey(businessId, period) {
  return [...HOME_QUERY_KEY, 'link-views-count', businessId ?? 'none', period];
}

/**
 * @param {string | null | undefined} businessId
 */
export function homeLinkViewsLastVisitQueryKey(businessId) {
  return [...HOME_QUERY_KEY, 'link-views-last-visit', businessId ?? 'none'];
}
