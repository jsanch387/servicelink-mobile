import { hasProAccessFromProfile } from '../more/utils/subscriptionPresentation';

/**
 * ## Upgrade paywall (mobile) — when to show `UpgradePaywallScreen`
 *
 * **Web parity**
 * ServiceLink web treats “can use Pro product surface” as **`hasProAccessFromProfile`**
 * (`src/features/more/utils/subscriptionPresentation.js`, built on `isProAccess`). The
 * mobile upgrade paywall is shown when that same check is **false** after we have a
 * successful account / profile bundle for the signed-in user.
 *
 * **Master switch — `ENABLE_FULL_SCREEN_UPGRADE_PAYWALL`**
 * When `false` (current product default), free-tier users use the main app and never see
 * `UpgradePaywallScreen` as a full-screen gate. Set to `true` to restore the post-onboarding
 * upgrade wall for users without Pro access.
 *
 * **`isProAccess` (summary)** — uses `profiles`-style fields:
 * - `subscription_tier` — if it contains `"pro"` (case-insensitive) → **has access** (no paywall).
 * - Else, access only if **both** `stripe_subscription_id` and `stripe_customer_id` are non-empty,
 *   `subscription_current_period_end` parses to a future instant, and `subscription_status` is one of:
 *   `active`, `trialing`, `past_due`, `canceled`, `cancelled`.
 * - A **free** tier user who only has `stripe_customer_id` (no subscription id, expired period, or
 *   status outside that list) **does not** have Pro access → **paywall applies** (same as web
 *   gating for post-trial / unpaid).
 *
 * **Full-screen gate (`AuthNavigator`)**
 * When the paywall applies, the stack shows **only** `UpgradePaywallScreen` (no tab bar, no other
 * stack screens) until `hasProAccess` becomes true. While the account bundle is still loading
 * (`isLoading` and not yet paywalled), a boot spinner is shown so users cannot switch tabs on a
 * stale Home screen. Use **`isPaywallDataStable`** from `SubscriptionContext` (not raw
 * `isOwnerProfileLoaded`) for the first argument so a background refetch after onboarding does not
 * briefly treat stale "free" cache as final and flash the paywall.
 *
 * **Upgrade checkout (after onboarding)**
 * **Upgrade to Pro** uses `createPaywallUpgradeCheckoutSession`: `POST /api/stripe/create-checkout-session`
 * with body `{ "client": "mobile" }` only (not `onboarding_trial_bridge`). Stripe return URLs on
 * the server must use the same prefix as `STRIPE_PAYWALL_CHECKOUT_AUTH_RETURN_URL` in
 * `stripePaywallCheckoutReturnUrl.js` (e.g. `servicelinkmobile://paywall/stripe?result=success`).
 * After the in-app browser closes, the app refetches the account bundle so `hasProAccess` updates.
 *
 * @module upgradePaywallGate
 */

/**
 * When `false`, the full-screen `UpgradePaywallScreen` in `AuthNavigator` is **never** shown
 * (free tier and others without Pro use tabs normally). Set to `true` to turn the gate back on.
 *
 * @type {boolean}
 */
export const ENABLE_FULL_SCREEN_UPGRADE_PAYWALL = false;

/**
 * UI iteration only — when `true`, the **entire main app** shows `UpgradePaywallScreen` (same as
 * production paywall) even before profile load. Ship with `false`.
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
 * When `true`, the signed-in main app should show **only** the upgrade paywall (no tabs).
 *
 * @param {{ isPaywallDataStable: boolean; hasProAccess: boolean }} args
 * @returns {boolean}
 */
export function shouldShowFullScreenSubscriptionPaywall({ isPaywallDataStable, hasProAccess }) {
  if (!ENABLE_FULL_SCREEN_UPGRADE_PAYWALL) return false;
  if (DEV_FORCE_UPGRADE_PAYWALL_IN_HOME_TAB) return true;
  return Boolean(isPaywallDataStable) && !hasProAccess;
}

/**
 * @deprecated Paywall moved to `AuthNavigator`; Home tab always uses `HomeScreen`. Prefer
 * `shouldShowFullScreenSubscriptionPaywall`.
 * @param {{ isPaywallDataStable: boolean; hasProAccess: boolean }} args
 * @returns {boolean}
 */
export function shouldUseUpgradePaywallHomeTab(args) {
  return shouldShowFullScreenSubscriptionPaywall(args);
}
