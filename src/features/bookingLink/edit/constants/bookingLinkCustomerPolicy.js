export const BOOKING_POLICY_MAX_LENGTH = 4000;

/**
 * @param {unknown} value
 * @returns {string}
 */
export function normalizeBookingPolicyText(value) {
  return String(value ?? '').slice(0, BOOKING_POLICY_MAX_LENGTH);
}
