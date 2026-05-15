import {
  hasProAccessFromProfile,
  hasStripeBillingHistoryFromProfile,
  isExplicitFreeSubscriptionTier,
} from '../more/utils/subscriptionPresentation';

/**
 * ## Upgrade paywall (mobile) — when to show `UpgradePaywallScreen`
 *
 * **Web parity (cohort B)** — after onboarding, users who have **Stripe billing history**
 * (`hasStripeBillingHistory` on web) but **do not** pass `isProAccess` were originally
 * shown the upgrade experience until they resubscribe. **Mobile adjustment:** if the
 * profile is explicitly **free tier** (`subscription_tier` `free` / `free_tier`), we
 * treat them like never-billed free: main tabs + in-app limits, even when `stripe_customer_id`
 * or `subscription_status` still reflects a past subscription.
 *
 * **Pro detection** — single source: `hasProAccessFromProfile` / `isProAccess` in
 * `subscriptionPresentation.js` (aligned with web `isProAccess.ts`).
 *
 * **Full-screen gate (`AuthNavigator`)**
 * Uses `isPaywallDataStable` from `SubscriptionContext` so refetches after onboarding do not flash
 * the paywall while data is reconciling.
 *
 * **Upgrade checkout**
 * See `docs` in-repo or `UpgradePaywallScreen` — mobile uses `POST /api/stripe/create-checkout-session`.
 *
 * @module upgradePaywallGate
 */

/**
 * When `false`, the full-screen `UpgradePaywallScreen` is never shown regardless of Stripe history.
 *
 * @type {boolean}
 */
export const ENABLE_FULL_SCREEN_UPGRADE_PAYWALL = true;

/**
 * UI iteration only — when `true`, the **entire main app** shows `UpgradePaywallScreen` even before
 * profile load. Ship with `false`.
 *
 * @type {boolean}
 */
export const DEV_FORCE_UPGRADE_PAYWALL_IN_HOME_TAB = false;

/**
 * @param {Record<string, unknown> | null | undefined} ownerProfile
 * @returns {boolean}
 */
export function shouldShowUpgradePaywallFromProfile(ownerProfile) {
  return !hasProAccessFromProfile(ownerProfile);
}

/**
 * When `true`, the signed-in main app should show **only** `UpgradePaywallScreen` (no tabs).
 *
 * @param {{
 *   isPaywallDataStable: boolean;
 *   hasProAccess: boolean;
 *   ownerProfile?: Record<string, unknown> | null;
 * }} args
 * @returns {boolean}
 */
export function shouldShowFullScreenSubscriptionPaywall({
  isPaywallDataStable,
  hasProAccess,
  ownerProfile = null,
}) {
  if (!ENABLE_FULL_SCREEN_UPGRADE_PAYWALL) return false;
  if (DEV_FORCE_UPGRADE_PAYWALL_IN_HOME_TAB) return true;
  if (!Boolean(isPaywallDataStable) || hasProAccess) return false;
  if (isExplicitFreeSubscriptionTier(ownerProfile)) return false;
  return hasStripeBillingHistoryFromProfile(ownerProfile);
}

/**
 * @deprecated Prefer `shouldShowFullScreenSubscriptionPaywall`.
 */
export function shouldUseUpgradePaywallHomeTab(args) {
  return shouldShowFullScreenSubscriptionPaywall(args);
}
