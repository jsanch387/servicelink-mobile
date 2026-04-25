/**
 * Client-only pricing option rows created before first save use this id prefix.
 * @param {string} id
 * @returns {boolean}
 */
export function isUnsavedPricingOptionId(id) {
  return String(id ?? '').startsWith('option-new-');
}
