import * as Linking from 'expo-linking';

/**
 * Reads `checkout_session_id` or `session_id` from the onboarding Stripe return URL
 * (see server contract: success URL may include `{CHECKOUT_SESSION_ID}`).
 *
 * @param {string | null | undefined} url
 * @returns {string | null}
 */
export function parseCheckoutSessionIdFromOnboardingReturnUrl(url) {
  if (!url || typeof url !== 'string') {
    return null;
  }
  try {
    const parsed = Linking.parse(url.trim());
    const q = parsed.queryParams ?? {};
    const pick = (/** @type {string} */ k) => {
      const v = q[k];
      if (v == null) {
        return null;
      }
      return Array.isArray(v) ? String(v[0] ?? '') : String(v);
    };
    const a = pick('checkout_session_id')?.trim();
    if (a) {
      return a;
    }
    const b = pick('session_id')?.trim();
    return b || null;
  } catch {
    return null;
  }
}
