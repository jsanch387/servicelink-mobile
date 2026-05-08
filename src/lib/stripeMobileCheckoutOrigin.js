import { Platform } from 'react-native';
import { getWebAppOrigin } from './webAppOrigin';

const PROD_WEB_ORIGIN = 'https://myservicelink.app';
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '10.0.2.2']);

/**
 * Base URL for Next.js `/api/stripe/create-checkout-session` (onboarding trial, paywall upgrade, etc.).
 * @returns {string | null}
 */
export function resolveStripeMobileCheckoutOrigin() {
  const origin = getWebAppOrigin();
  if (!__DEV__) {
    return origin || PROD_WEB_ORIGIN;
  }
  if (origin && origin !== PROD_WEB_ORIGIN) {
    return origin;
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000';
  }
  return 'http://localhost:3000';
}

/**
 * @param {string} origin
 * @throws {Error} In production when origin is invalid for Stripe checkout.
 */
export function assertStripeCheckoutOriginAllowed(origin) {
  let parsed;
  try {
    parsed = new URL(origin);
  } catch {
    throw new Error('Invalid EXPO_PUBLIC_WEB_APP_URL');
  }

  if (!__DEV__) {
    if (parsed.protocol !== 'https:') {
      throw new Error('Production checkout requires an https web origin');
    }
    if (LOCAL_HOSTS.has(parsed.hostname)) {
      throw new Error('Production checkout cannot target localhost');
    }
  }
}
