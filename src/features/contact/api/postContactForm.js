import { Platform } from 'react-native';
import { getWebAppOrigin } from '../../../lib/webAppOrigin';

const PROD_WEB_ORIGIN = 'https://myservicelink.app';
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '10.0.2.2']);

function resolveContactFormOrigin() {
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
      throw new Error('Production contact form requires an https web origin');
    }
    if (LOCAL_HOSTS.has(parsed.hostname)) {
      throw new Error('Production contact form cannot target localhost');
    }
  }
}

function parseRetryAfterSeconds(headerValue) {
  if (!headerValue) {
    return undefined;
  }
  const seconds = Number.parseInt(String(headerValue).trim(), 10);
  return Number.isFinite(seconds) && seconds > 0 ? seconds : undefined;
}

/**
 * POST `{origin}/api/contact` — public; emails support via the Next.js server (Resend).
 *
 * @param {{ name: string; email: string; topic: string; message: string }} body
 * @returns {Promise<
 *   | { ok: true }
 *   | { ok: false; error: string; code?: string; retryAfterSeconds?: number; httpStatus: number }
 * >}
 */
export async function postContactForm(body) {
  const origin = resolveContactFormOrigin();
  if (!origin) {
    return {
      ok: false,
      error: 'EXPO_PUBLIC_WEB_APP_URL is not set',
      httpStatus: 0,
    };
  }

  try {
    assertOriginIsAllowed(origin);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Invalid web origin',
      httpStatus: 0,
    };
  }

  let res;
  try {
    res = await fetch(`${origin}/api/contact`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: body.name,
        email: body.email,
        topic: body.topic,
        message: body.message,
        website: '',
      }),
    });
  } catch {
    return {
      ok: false,
      error: "Can't connect right now. Check your internet and try again.",
      httpStatus: 0,
    };
  }

  let payload = {};
  try {
    payload = await res.json();
  } catch {
    payload = {};
  }

  const serverError =
    typeof payload?.error === 'string'
      ? payload.error
      : typeof payload?.message === 'string'
        ? payload.message
        : null;
  const code = typeof payload?.code === 'string' ? payload.code : undefined;

  if (res.ok && payload?.success === true) {
    return { ok: true };
  }

  const retryAfterSeconds = parseRetryAfterSeconds(res.headers.get('Retry-After'));
  const fallback =
    res.status === 429
      ? 'Too many messages sent. Please try again later.'
      : res.status === 503
        ? 'We could not send your message right now. Please try again shortly.'
        : `Something went wrong (${res.status}). Please try again.`;

  return {
    ok: false,
    error: serverError || fallback,
    code,
    retryAfterSeconds,
    httpStatus: res.status,
  };
}
