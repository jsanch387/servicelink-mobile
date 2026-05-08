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
 * **Home tab**
 * Mount the paywall only when `query.isSuccess` for the account bundle (`isOwnerProfileLoaded` from
 * `SubscriptionContext`) so we do not flash the paywall during loading or fall back incorrectly on
 * fetch errors.
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
 * UI iteration only — when `true`, the Home tab always shows `UpgradePaywallScreen`
 * (ignores profile / subscription gate). Ship with `false`.
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
 * @param {{ isOwnerProfileLoaded: boolean; hasProAccess: boolean }} args
 * @returns {boolean}
 */
export function shouldUseUpgradePaywallHomeTab({ isOwnerProfileLoaded, hasProAccess }) {
  if (DEV_FORCE_UPGRADE_PAYWALL_IN_HOME_TAB) return true;
  return Boolean(isOwnerProfileLoaded) && !hasProAccess;
}
