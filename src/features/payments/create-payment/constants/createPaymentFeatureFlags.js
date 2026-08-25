/**
 * Home FAB → Create payment (walk-up payment link + Tap to Pay).
 *
 * **Kill switch:** set `CREATE_PAYMENT_FEATURE_ENABLED` to `false` to hide
 * Create payment on the home FAB and bounce the screen.
 *
 * **Closed prod testing (current):** non-empty
 * `CREATE_PAYMENT_EARLY_ACCESS_EMAILS` means ONLY those logins see the feature.
 * Empty the array to roll out (Pro + Stripe Connect still required to charge).
 */

/** Master kill switch for walk-up Create payment. */
export const CREATE_PAYMENT_FEATURE_ENABLED = true;

/**
 * Temporary early-access login emails (lowercase).
 * Non-empty = ONLY these emails get the FAB + screen.
 * Empty = everyone can open the screen (Pro / Connect still gated inside).
 *
 * @type {readonly string[]}
 */
export const CREATE_PAYMENT_EARLY_ACCESS_EMAILS = ['jesuss387@gmail.com'];
