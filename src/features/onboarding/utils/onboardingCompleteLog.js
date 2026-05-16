/**
 * Step 5 activation (`POST /api/onboarding-v2/complete`) — light diagnostics only.
 */

/**
 * @param {string} message
 * @param {unknown} [extra]
 */
export function onboardingCompleteLogOk(message, extra) {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.info(`[onboarding:activate] ${message}`, extra ?? '');
  }
}

/**
 * @param {string} message
 * @param {unknown} [extra]
 */
export function onboardingCompleteLogError(message, extra) {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.warn(`[onboarding:activate] ${message}`, extra ?? '');
  }
}
