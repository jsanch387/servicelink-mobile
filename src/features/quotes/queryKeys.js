/** Root segment for React Query — invalidate entire quotes subtree when quote mutations ship. */
export const QUOTES_QUERY_ROOT = ['quotes'];

/**
 * @param {string | undefined} businessId
 */
export function quotesListQueryKey(businessId) {
  return ['quotes', 'list', businessId];
}

/**
 * @param {string | undefined} businessId
 * @param {string | undefined} quoteId
 */
export function quoteDetailQueryKey(businessId, quoteId) {
  return ['quotes', 'detail', businessId, quoteId];
}
