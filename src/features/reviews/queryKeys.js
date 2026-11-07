/** @type {const} */
export const REVIEWS_QUERY_ROOT = ['reviews'];

export function reviewsListQueryKey(businessId) {
  return [...REVIEWS_QUERY_ROOT, 'list', businessId ?? 'none'];
}

export function reviewsGoogleStatusQueryKey(userId) {
  return [...REVIEWS_QUERY_ROOT, 'google-status', userId ?? 'none'];
}
