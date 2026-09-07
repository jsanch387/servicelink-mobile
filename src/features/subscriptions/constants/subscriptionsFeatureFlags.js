/**
 * Owner subscriptions / memberships feature flags (compile-time).
 *
 * **Kill switch:** set `SUBSCRIPTIONS_FEATURE_ENABLED` to `false` to hide the
 * More → Subscriptions row and skip membership fetches everywhere.
 *
 * **Open (current):** empty `SUBSCRIPTIONS_EARLY_ACCESS_EMAILS` — every login
 * sees Subscriptions. Pro shops get the hub; non-Pro see the in-app upsell.
 * Put emails back in the array to restrict the feature again.
 */

/** Master kill switch for owner subscriptions / memberships. */
export const SUBSCRIPTIONS_FEATURE_ENABLED = true;

/**
 * Temporary early-access login emails (lowercase).
 * Non-empty = ONLY these emails get the feature (Pro not listed are excluded).
 * Empty = open rollout (Pro hub / non-Pro upsell).
 *
 * @type {readonly string[]}
 */
export const SUBSCRIPTIONS_EARLY_ACCESS_EMAILS = [];
