/**
 * @typedef {object} TapToPayConnectParams
 * @property {string | null} terminalLocationId
 * @property {string | null} stripeAccountId
 * @property {string | null} merchantDisplayName
 */

/**
 * Parse optional Connect / Terminal fields from tap-to-pay intent API payload.
 *
 * @param {Record<string, unknown> | null | undefined} payload
 * @returns {TapToPayConnectParams}
 */
export function parseTapToPayIntentConnectParams(payload) {
  const readString = (...keys) => {
    for (const key of keys) {
      const value = payload?.[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }
    return null;
  };

  return {
    terminalLocationId: readString(
      'terminalLocationId',
      'locationId',
      'stripeTerminalLocationId',
      'stripe_terminal_location_id',
    ),
    stripeAccountId: readString('stripeAccountId', 'onBehalfOf', 'stripe_account_id'),
    merchantDisplayName: readString('merchantDisplayName', 'merchant_display_name'),
  };
}
