/**
 * Customer SMS / job-lifecycle feature flags (compile-time).
 *
 * **Kill switch:** set `CUSTOMER_SMS_ENABLED` to `false` to:
 * - Restore legacy Next Up (device Messages On my way + Navigate only)
 * - Hide Job status on booking details
 * - Hide customer-text rows on Notification settings
 * - Turn off SMS toasts and complete-visit “we'll text” copy
 *
 * **Rollout:**
 * 1. Enable flag, add your prod login email to `CUSTOMER_SMS_EARLY_ACCESS_EMAILS`, ship, QA.
 *    While this list is non-empty, ONLY those emails get the feature — everyone
 *    else (including existing Pro subscribers) sees the app exactly as if this
 *    flag were off. Safe to ship to prod without exposing it to real customers.
 * 2. Clear the allowlist (empty array) → Pro subscribers only (`hasProAccess`).
 * 3. Non-Pro still see a Customer notifications upsell (when the flag is on).
 */

/** Master kill switch for server-backed customer SMS + job lifecycle CTAs. */
export const CUSTOMER_SMS_ENABLED = true;

/**
 * Temporary early-access login emails (lowercase). Non-empty = ONLY these
 * emails get the feature (Pro subscribers not listed are excluded too).
 * Empty = Pro-only gating applies to everyone. Clear after personal prod QA.
 *
 * Currently a placeholder address that no real login owns, so every account —
 * including your own — gets the legacy no-SMS experience. Swap in your prod
 * login email to turn the feature on for yourself.
 *
 * @type {readonly string[]}
 */
export const CUSTOMER_SMS_EARLY_ACCESS_EMAILS = ['jesuss387@gmail.com'];
