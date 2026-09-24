/**
 * Customer SMS / job-lifecycle feature flags (compile-time).
 *
 * **Kill switch:** set `CUSTOMER_SMS_ENABLED` to `false` to:
 * - Restore legacy Next Up (device Messages On my way + Navigate only)
 * - Hide Job status on booking details
 * - Hide customer-text rows on Notification settings
 * - Turn off SMS toasts and complete-visit “we'll text” copy
 *
 * **Rollout (current):** allowlist empty → any signed-in shop user (owner or
 * team member) gets server SMS / On my way. Not gated on Pro.
 *
 * Optional early-access: put emails in `CUSTOMER_SMS_EARLY_ACCESS_EMAILS` to
 * temporarily restrict the feature to those logins only.
 */

/** Master kill switch for server-backed customer SMS + job lifecycle CTAs. */
export const CUSTOMER_SMS_ENABLED = true;

/**
 * Temporary early-access login emails (lowercase).
 * Non-empty = ONLY these emails get the feature (Pro not listed are excluded).
 * Empty = open for every signed-in shop user (production).
 *
 * @type {readonly string[]}
 */
export const CUSTOMER_SMS_EARLY_ACCESS_EMAILS = [];
