import { Platform } from 'react-native';
import { getWebAppOrigin } from '../../../lib/webAppOrigin';

const PROD_WEB_ORIGIN = 'https://myservicelink.app';
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '10.0.2.2']);

function resolveDeleteAccountOrigin() {
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

function toSafeHost(origin) {
  try {
    return new URL(origin).host;
  } catch {
    return 'invalid-origin';
  }
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
      throw new Error('Production account deletion requires an https web origin');
    }
    if (LOCAL_HOSTS.has(parsed.hostname)) {
      throw new Error('Production account deletion cannot target localhost');
    }
  }
}

function logDeleteAccount(event, payload = undefined) {
  if (payload === undefined) {
     
    console.info(`[account-delete] ${event}`);
    return;
  }
   
  console.info(`[account-delete] ${event}`, payload);
}

/**
 * DELETE `{origin}/api/account`
 * Body: `{ confirmEmail }`
 * Auth: `Authorization: Bearer <access token>`
 *
 * @param {{ accessToken: string; confirmEmail: string }} input
 * @returns {Promise<{ success: true }>}
 */
export async function deleteAccountViaWeb({ accessToken, confirmEmail }) {
  const token = String(accessToken ?? '').trim();
  const email = String(confirmEmail ?? '').trim();
  if (!token) {
    throw new Error('Not signed in');
  }
  if (!email) {
    throw new Error('Enter your email to confirm.');
  }

  const origin = resolveDeleteAccountOrigin();
  if (!origin) {
    throw new Error('EXPO_PUBLIC_WEB_APP_URL is not set');
  }
  assertOriginIsAllowed(origin);
  logDeleteAccount('start', { host: toSafeHost(origin) });

  let res;
  try {
    res = await fetch(`${origin}/api/account`, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ confirmEmail: email }),
    });
  } catch (error) {
    logDeleteAccount('network-error', {
      host: toSafeHost(origin),
      name: error instanceof Error ? error.name : 'Error',
    });
    throw error;
  }

  let body = {};
  try {
    body = await res.json();
  } catch {
    body = {};
  }
  logDeleteAccount('response', { host: toSafeHost(origin), status: res.status, ok: res.ok });

  const serverMessage =
    typeof body?.error === 'string'
      ? body.error
      : typeof body?.message === 'string'
        ? body.message
        : null;

  if (!res.ok || body?.success === false) {
    logDeleteAccount('error', { host: toSafeHost(origin), status: res.status });
    throw new Error(serverMessage || `Account deletion failed (${res.status})`);
  }

  logDeleteAccount('success');
  return { success: true };
}
