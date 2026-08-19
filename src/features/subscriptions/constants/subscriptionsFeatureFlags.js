/**
 * Owner subscriptions / memberships feature flags (compile-time).
 *
 * **Kill switch:** set `SUBSCRIPTIONS_FEATURE_ENABLED` to `false` to hide the
 * More → Subscriptions row and skip membership fetches everywhere.
 *
 * **Closed prod testing (current):** non-empty
 * `SUBSCRIPTIONS_EARLY_ACCESS_EMAILS` means ONLY those logins see the feature
 * (even Pro shops not listed are excluded). Empty the array to roll out to
 * all Pro subscribers.
 */

/** Master kill switch for owner subscriptions / memberships. */
export const SUBSCRIPTIONS_FEATURE_ENABLED = true;

/**
 * Temporary early-access login emails (lowercase).
 * Non-empty = ONLY these emails get the feature (Pro not listed are excluded).
 * Empty = Pro-only gating for everyone (production release).
 *
 * @type {readonly string[]}
 */
export const SUBSCRIPTIONS_EARLY_ACCESS_EMAILS = [
  'urbanink.help@gmail.com',
  'jesuss387@gmail.com',
];
