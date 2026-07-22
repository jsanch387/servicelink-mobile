/**
 * Session-only skip for the service-area prompt (web sessionStorage equivalent).
 * Cleared when the app process dies → prompt shows again on cold start.
 */

export const SERVICE_AREA_PROMPT_DISMISSIBLE = true;

const SERVICE_AREA_SESSION_SKIP_KEY_PREFIX = 'servicelink:service-area-skip:';

/** @type {Set<string>} */
const skippedBusinessProfileIds = new Set();

/**
 * @param {string} businessProfileId
 */
export function serviceAreaSessionSkipKey(businessProfileId) {
  return `${SERVICE_AREA_SESSION_SKIP_KEY_PREFIX}${businessProfileId}`;
}

/**
 * @param {string} businessProfileId
 */
export function isServiceAreaSkippedThisSession(businessProfileId) {
  if (!businessProfileId) return false;
  return skippedBusinessProfileIds.has(businessProfileId);
}

/**
 * @param {string} businessProfileId
 */
export function markServiceAreaSkippedThisSession(businessProfileId) {
  if (!businessProfileId) return;
  skippedBusinessProfileIds.add(businessProfileId);
}

/**
 * @param {string} businessProfileId
 */
export function clearServiceAreaSessionSkip(businessProfileId) {
  if (!businessProfileId) return;
  skippedBusinessProfileIds.delete(businessProfileId);
}
