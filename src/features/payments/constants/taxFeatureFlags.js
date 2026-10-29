/**
 * Pre-release lock for the Payments → Taxes card.
 *
 * Non-empty: only these logins see the card.
 * Empty: every shop sees Taxes. Clear this array to open the feature.
 *
 * @type {readonly string[]}
 */
export const TAX_SETTINGS_EARLY_ACCESS_EMAILS = ['jesuss387@gmail.com', 'jesuss3872@gmail.com'];
