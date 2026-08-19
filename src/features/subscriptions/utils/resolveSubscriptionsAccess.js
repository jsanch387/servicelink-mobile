import {
  SUBSCRIPTIONS_EARLY_ACCESS_EMAILS,
  SUBSCRIPTIONS_FEATURE_ENABLED,
} from '../constants/subscriptionsFeatureFlags';

/**
 * @param {string | null | undefined} email
 * @returns {boolean}
 */
export function isSubscriptionsEarlyAccessEmail(email) {
  const normalized = String(email ?? '')
    .trim()
    .toLowerCase();
  if (!normalized) {
    return false;
  }
  return SUBSCRIPTIONS_EARLY_ACCESS_EMAILS.some(
    (entry) => entry.trim().toLowerCase() === normalized,
  );
}

/**
 * Resolves whether this owner can use subscriptions / memberships UI.
 *
 * Rollout phases:
 * 1. **Email-only** — `SUBSCRIPTIONS_EARLY_ACCESS_EMAILS` is non-empty. Only those
 *    exact logins get `canUseSubscriptions`; everyone else (including existing Pro
 *    subscribers) sees the app as if the flag were off.
 * 2. **Pro-gated** — clear the allowlist. Pro subscribers get the hub; non-Pro
 *    see the upsell inside Subscriptions.
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
 *   canUseSubscriptions: boolean;
 *   showUpsell: boolean;
 *   isReady: boolean;
 * }}
 */
export function resolveSubscriptionsAccess({
  enabled = SUBSCRIPTIONS_FEATURE_ENABLED,
  hasProAccess = false,
  email = null,
  profileLoaded = true,
  restrictToEarlyAccess = SUBSCRIPTIONS_EARLY_ACCESS_EMAILS.length > 0,
} = {}) {
  if (!enabled) {
    return {
      featureEnabled: false,
      canUseSubscriptions: false,
      showUpsell: false,
      isReady: true,
    };
  }

  if (isSubscriptionsEarlyAccessEmail(email)) {
    return {
      featureEnabled: true,
      canUseSubscriptions: true,
      showUpsell: false,
      isReady: true,
    };
  }

  if (restrictToEarlyAccess) {
    return {
      featureEnabled: false,
      canUseSubscriptions: false,
      showUpsell: false,
      isReady: true,
    };
  }

  if (!profileLoaded) {
    return {
      featureEnabled: true,
      canUseSubscriptions: false,
      showUpsell: false,
      isReady: false,
    };
  }

  if (hasProAccess) {
    return {
      featureEnabled: true,
      canUseSubscriptions: true,
      showUpsell: false,
      isReady: true,
    };
  }

  return {
    featureEnabled: true,
    canUseSubscriptions: false,
    showUpsell: true,
    isReady: true,
  };
}
