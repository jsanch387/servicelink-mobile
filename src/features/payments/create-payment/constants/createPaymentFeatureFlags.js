/**
 * Home FAB → Create payment (walk-up payment link + Tap to Pay).
 *
 * **Kill switch:** set `CREATE_PAYMENT_FEATURE_ENABLED` to `false` to hide
 * Create payment on the home FAB and bounce the screen.
 *
 * **Open (current):** empty `CREATE_PAYMENT_EARLY_ACCESS_EMAILS` — anyone can
 * open the screen. Pro + Stripe Connect still required to charge.
 * Put emails back in the array to restrict the FAB again.
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
export const CREATE_PAYMENT_EARLY_ACCESS_EMAILS = [];
