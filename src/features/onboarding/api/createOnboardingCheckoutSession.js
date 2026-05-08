import { Platform } from 'react-native';
import { getWebAppOrigin } from '../../../lib/webAppOrigin';

const PROD_WEB_ORIGIN = 'https://myservicelink.app';
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '10.0.2.2']);

function resolveCheckoutOrigin() {
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

function assertOriginIsAllowed(origin) {
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

/**
 * POST `/api/stripe/create-checkout-session` — mobile onboarding free trial (Stripe Checkout).
 *
 * @param {string | null | undefined} accessToken - Supabase `session.access_token`
 * @returns {Promise<{ url: string } | { error: Error; httpStatus: number }>}
 */
export async function createOnboardingCheckoutSession(accessToken) {
  const origin = resolveCheckoutOrigin();
  if (!origin) {
    return { error: new Error('EXPO_PUBLIC_WEB_APP_URL is not set'), httpStatus: 0 };
  }
  if (!accessToken) {
    return { error: new Error('Not signed in'), httpStatus: 0 };
  }
  try {
    assertOriginIsAllowed(origin);
  } catch (error) {
    return {
      error: error instanceof Error ? error : new Error('Invalid web origin'),
      httpStatus: 0,
    };
  }
  let res;
  try {
    res = await fetch(`${origin}/api/stripe/create-checkout-session`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: 'onboarding_trial_bridge',
        client: 'mobile',
      }),
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error : new Error('Network request failed'),
      httpStatus: 0,
    };
  }

  let body = {};
  try {
    body = await res.json();
  } catch {
    body = {};
  }

  const serverError =
    typeof body?.error === 'string'
      ? body.error
      : typeof body?.message === 'string'
        ? body.message
        : null;

  const failed = !res.ok || body?.success === false;
  if (failed) {
    const msg = serverError || `Request failed (${res.status})`;
    return { error: new Error(msg), httpStatus: res.status };
  }

  if (body?.success === true && typeof body?.url === 'string' && body.url.length > 0) {
    return { url: body.url };
  }

  return {
    error: new Error(serverError || 'Invalid response'),
    httpStatus: res.status,
  };
}
