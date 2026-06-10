/**
 * App-store review prompt tuning.
 *
 * The eligibility signal is the business's lifetime completed-booking count from the
 * server (not a local counter), so owners who were active before this feature shipped
 * qualify right away.
 *
 * Apple/Google additionally rate-limit the native dialog on their side (~3x/year on iOS),
 * so these guards only control how often we *ask* the OS.
 */

/** Minimum lifetime completed bookings before we ever ask. */
export const APP_REVIEW_MIN_COMPLETED_BOOKINGS = 3;

/** Days to wait between our own prompt attempts. */
export const APP_REVIEW_PROMPT_COOLDOWN_DAYS = 120;

/** Delay after a successful completion before prompting, so sheets/overlays finish dismissing. */
export const APP_REVIEW_PROMPT_DELAY_MS = 1600;

export const APP_REVIEW_PROMPT_HISTORY_KEY = 'servicelink.appReviewPromptHistory';
