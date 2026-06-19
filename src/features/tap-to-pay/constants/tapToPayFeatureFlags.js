/**
 * Tap to Pay Phase 2 rollout (compile-time flags).
 *
 * - `USE_SERVER_APIS`: call connection-token + intent before collection.
 * - `USE_TERMINAL_SDK`: real Stripe Terminal / Tap to Pay on iPhone (requires native SDK).
 * - `DEV_MOCK_COLLECTION`: when SDK is off, allow mock tap UI in __DEV__ only (no real charge).
 */

export const TAP_TO_PAY_USE_SERVER_APIS = true;

/** Real Stripe Terminal / Tap to Pay on iPhone and Android (requires native dev client build). */
export const TAP_TO_PAY_USE_TERMINAL_SDK = true;

/** Mock collection after a real PaymentIntent — dev UI testing only; job_completed still needs SDK. */
export const TAP_TO_PAY_DEV_MOCK_COLLECTION =
  typeof __DEV__ !== 'undefined' && __DEV__ && !TAP_TO_PAY_USE_TERMINAL_SDK;

/**
 * Whether the Complete sheet should show an active Tap to Pay entry point.
 */
export function isTapToPayUiEnabled() {
  if (!TAP_TO_PAY_USE_SERVER_APIS) {
    return false;
  }
  return TAP_TO_PAY_USE_TERMINAL_SDK || TAP_TO_PAY_DEV_MOCK_COLLECTION;
}
