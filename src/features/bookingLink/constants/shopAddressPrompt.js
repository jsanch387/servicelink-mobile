/** Session-only skip. Shows again on the next cold start until shop city/state are saved. */

/** @type {Set<string>} */
const skippedBusinessProfileIds = new Set();

/**
 * @param {string} businessProfileId
 */
export function isShopAddressPromptSkippedThisSession(businessProfileId) {
  if (!businessProfileId) return false;
  return skippedBusinessProfileIds.has(businessProfileId);
}

/**
 * @param {string} businessProfileId
 */
export function markShopAddressPromptSkippedThisSession(businessProfileId) {
  if (!businessProfileId) return;
  skippedBusinessProfileIds.add(businessProfileId);
}
