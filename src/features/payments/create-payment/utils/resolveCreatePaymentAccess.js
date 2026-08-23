import {
  CREATE_PAYMENT_EARLY_ACCESS_EMAILS,
  CREATE_PAYMENT_FEATURE_ENABLED,
} from '../constants/createPaymentFeatureFlags';

/**
 * @param {string | null | undefined} email
 * @returns {boolean}
 */
export function isCreatePaymentEarlyAccessEmail(email) {
  const normalized = String(email ?? '')
    .trim()
    .toLowerCase();
  if (!normalized) {
    return false;
  }
  return CREATE_PAYMENT_EARLY_ACCESS_EMAILS.some(
    (entry) => entry.trim().toLowerCase() === normalized,
  );
}

/**
 * Rollout for Home → Create payment (not Connect / charge readiness).
 *
 * 1. **Email-only** — allowlist non-empty. Only those logins see the FAB.
 *    Pro / Connect are still checked on the screen.
 * 2. **Open** — clear the allowlist. Anyone can open the screen; non-Pro
 *    get the web upsell; missing Connect goes to Payments → Settings.
 *
 * @param {{
 *   enabled?: boolean;
 *   hasProAccess?: boolean;
 *   email?: string | null;
 *   profileLoaded?: boolean;
 *   restrictToEarlyAccess?: boolean;
 * }} [params]
 * @returns {{
 *   featureEnabled: boolean;
 *   canUseCreatePayment: boolean;
 *   showUpsell: boolean;
 *   isReady: boolean;
 * }}
 */
export function resolveCreatePaymentAccess({
  enabled = CREATE_PAYMENT_FEATURE_ENABLED,
  hasProAccess = false,
  email = null,
  profileLoaded = true,
  restrictToEarlyAccess = CREATE_PAYMENT_EARLY_ACCESS_EMAILS.length > 0,
} = {}) {
  if (!enabled) {
    return {
      featureEnabled: false,
      canUseCreatePayment: false,
      showUpsell: false,
      isReady: true,
    };
  }

  const onAllowlist = isCreatePaymentEarlyAccessEmail(email);
  if (restrictToEarlyAccess && !onAllowlist) {
    return {
      featureEnabled: false,
      canUseCreatePayment: false,
      showUpsell: false,
      isReady: true,
    };
  }

  if (!profileLoaded) {
    return {
      featureEnabled: true,
      canUseCreatePayment: false,
      showUpsell: false,
      isReady: false,
    };
  }

  if (hasProAccess) {
    return {
      featureEnabled: true,
      canUseCreatePayment: true,
      showUpsell: false,
      isReady: true,
    };
  }

  return {
    featureEnabled: true,
    canUseCreatePayment: false,
    showUpsell: true,
    isReady: true,
  };
}
