import {
  CUSTOMER_SMS_EARLY_ACCESS_EMAILS,
  CUSTOMER_SMS_ENABLED,
} from '../constants/customerSmsFlags';

/**
 * @param {string | null | undefined} email
 * @returns {boolean}
 */
export function isCustomerSmsEarlyAccessEmail(email) {
  const normalized = String(email ?? '')
    .trim()
    .toLowerCase();
  if (!normalized) {
    return false;
  }
  return CUSTOMER_SMS_EARLY_ACCESS_EMAILS.some(
    (entry) => entry.trim().toLowerCase() === normalized,
  );
}

/**
 * Resolves whether this owner can use server SMS / lifecycle UI.
 *
 * Rollout phases:
 * 1. **Email-only** — `CUSTOMER_SMS_EARLY_ACCESS_EMAILS` is non-empty. Only those
 *    exact logins get `canUseSms`; everyone else (including existing Pro
 *    subscribers) sees the app exactly as if the flag were off. This lets you
 *    ship to prod and test on your own account without exposing it to real customers.
 * 2. **Pro-gated** — clear the allowlist. Pro subscribers get `canUseSms`; non-Pro
 *    see the upsell screen.
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
 *   canUseSms: boolean;
 *   showUpsell: boolean;
 *   isReady: boolean;
 * }}
 */
export function resolveCustomerSmsAccess({
  enabled = CUSTOMER_SMS_ENABLED,
  hasProAccess = false,
  email = null,
  profileLoaded = true,
  restrictToEarlyAccess = CUSTOMER_SMS_EARLY_ACCESS_EMAILS.length > 0,
} = {}) {
  if (!enabled) {
    return {
      featureEnabled: false,
      canUseSms: false,
      showUpsell: false,
      isReady: true,
    };
  }

  if (isCustomerSmsEarlyAccessEmail(email)) {
    return {
      featureEnabled: true,
      canUseSms: true,
      showUpsell: false,
      isReady: true,
    };
  }

  // Phase 1 rollout: allowlist is populated, so nobody outside it gets the
  // feature yet — not even Pro subscribers. Behaves as if disabled for them.
  if (restrictToEarlyAccess) {
    return {
      featureEnabled: false,
      canUseSms: false,
      showUpsell: false,
      isReady: true,
    };
  }

  if (!profileLoaded) {
    return {
      featureEnabled: true,
      canUseSms: false,
      showUpsell: false,
      isReady: false,
    };
  }

  if (hasProAccess) {
    return {
      featureEnabled: true,
      canUseSms: true,
      showUpsell: false,
      isReady: true,
    };
  }

  return {
    featureEnabled: true,
    canUseSms: false,
    showUpsell: true,
    isReady: true,
  };
}
