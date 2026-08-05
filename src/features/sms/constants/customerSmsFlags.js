/**
 * Customer SMS / job-lifecycle feature flags (compile-time).
 *
 * **Kill switch:** set `CUSTOMER_SMS_ENABLED` to `false` to:
 * - Restore legacy Next Up (device Messages On my way + Navigate only)
 * - Hide Job status on booking details
 * - Hide customer-text rows on Notification settings
 * - Turn off SMS toasts and complete-visit “we'll text” copy
 *
 * **Rollout (current):** allowlist empty → Pro subscribers get SMS (`hasProAccess`).
 * Non-Pro see the Customer notifications upsell when the flag is on.
 *
 * Optional early-access: put emails in `CUSTOMER_SMS_EARLY_ACCESS_EMAILS` to
 * temporarily restrict the feature to those logins only (even Pro is excluded).
 */

/** Master kill switch for server-backed customer SMS + job lifecycle CTAs. */
export const CUSTOMER_SMS_ENABLED = true;

/**
 * Temporary early-access login emails (lowercase).
 * Non-empty = ONLY these emails get the feature (Pro not listed are excluded).
 * Empty = Pro-only gating for everyone (production release).
 *
 * @type {readonly string[]}
 */
export const CUSTOMER_SMS_EARLY_ACCESS_EMAILS = [];
