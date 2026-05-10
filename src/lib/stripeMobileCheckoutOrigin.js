import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { getWebAppOrigin } from './webAppOrigin';

const PROD_WEB_ORIGIN = 'https://myservicelink.app';
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '10.0.2.2']);

let warnedPhysicalDeviceDevFallback = false;

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
  const fallback = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
  if (!warnedPhysicalDeviceDevFallback && Constants.isDevice) {
    warnedPhysicalDeviceDevFallback = true;
    console.warn(
      '[dev] Physical device is using emulator-style localhost for Next.js API. Set EXPO_PUBLIC_WEB_APP_URL=http://<your-mac-LAN-ip>:3000 in .env.local (and restart Metro) so booking/quote/push flows hit your machine.',
    );
  }
  return fallback;
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
