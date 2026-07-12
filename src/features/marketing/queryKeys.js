/** @type {const} */
export const MARKETING_QUERY_ROOT = ['marketing'];

/**
 * @param {string | null | undefined} businessId
 */
export function marketingPromoCodesQueryKey(businessId) {
  return [...MARKETING_QUERY_ROOT, 'promo-codes', businessId ?? 'none'];
}

/**
 * @param {string | null | undefined} businessId
 */
export function marketingSalesQueryKey(businessId) {
  return [...MARKETING_QUERY_ROOT, 'sales', businessId ?? 'none'];
}
