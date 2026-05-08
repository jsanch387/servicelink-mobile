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
 * stale Home screen.
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
 * @param {{ isOwnerProfileLoaded: boolean; hasProAccess: boolean }} args
 * @returns {boolean}
 */
export function shouldShowFullScreenSubscriptionPaywall({ isOwnerProfileLoaded, hasProAccess }) {
  if (DEV_FORCE_UPGRADE_PAYWALL_IN_HOME_TAB) return true;
  return Boolean(isOwnerProfileLoaded) && !hasProAccess;
}

/**
 * @deprecated Paywall moved to `AuthNavigator`; Home tab always uses `HomeScreen`. Prefer
 * `shouldShowFullScreenSubscriptionPaywall`.
 * @param {{ isOwnerProfileLoaded: boolean; hasProAccess: boolean }} args
 * @returns {boolean}
 */
export function shouldUseUpgradePaywallHomeTab(args) {
  return shouldShowFullScreenSubscriptionPaywall(args);
}
