/** @type {const} */
export const REVIEWS_QUERY_ROOT = ['reviews'];

export function reviewsListQueryKey(businessId) {
  return [...REVIEWS_QUERY_ROOT, 'list', businessId ?? 'none'];
}
