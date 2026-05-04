import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { supabase } from '../../../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

/**
 * Must match Android intent-filter / iOS URL scheme and a row in Supabase Auth
 * → URL Configuration → Additional Redirect URLs (exactly this string).
 *
 * Use a fixed native URL (not Linking.createURL) so Supabase never receives a dev
 * URL that is not allowlisted — unlisted redirects fall back to your Site URL
 * (e.g. https://myservicelink.app), which looks like "Google sent me to my site".
 */
const NATIVE_OAUTH_REDIRECT = 'servicelinkmobile://auth/callback';

function getWebOAuthRedirectUrl() {
  if (typeof window === 'undefined') {
    return '';
  }
  const { origin, pathname } = window.location;
  if (!pathname || pathname === '/') {
    return origin;
  }
  return `${origin}${pathname.replace(/\/$/, '')}`;
}

export function getGoogleOAuthRedirectUrl() {
  if (Platform.OS === 'web') {
    return getWebOAuthRedirectUrl();
  }
  return NATIVE_OAUTH_REDIRECT;
}

function parseOAuthUrlParams(url) {
  const out = {};
  const ingest = (segment) => {
    if (!segment) {
      return;
    }
    const s = segment.startsWith('#') ? segment.slice(1) : segment;
    const q = s.startsWith('?') ? s.slice(1) : s;
    if (!q) {
      return;
    }
    const sp = new URLSearchParams(q);
    sp.forEach((v, k) => {
      out[k] = v;
    });
  };

  try {
    const u = new URL(url);
    ingest(u.search);
    ingest(u.hash);
  } catch {
    const hashIdx = url.indexOf('#');
    const base = hashIdx >= 0 ? url.slice(0, hashIdx) : url;
    const queryIdx = base.indexOf('?');
    if (queryIdx >= 0) {
      ingest(base.slice(queryIdx));
    }
    if (hashIdx >= 0) {
      ingest(url.slice(hashIdx));
    }
  }
  return out;
}

async function finishOAuthFromUrl(url) {
  const params = parseOAuthUrlParams(url);

  const oauthErr = params.error ?? params.error_code;
  if (oauthErr) {
    const desc = params.error_description;
    let message = String(oauthErr);
    if (typeof desc === 'string') {
      try {
        message = decodeURIComponent(desc.replace(/\+/g, ' '));
      } catch {
        message = desc;
      }
    }
    return { error: new Error(message) };
  }

  if (params.code) {
    return supabase.auth.exchangeCodeForSession(params.code);
  }
  if (params.access_token && params.refresh_token) {
    return supabase.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    });
  }

  return { error: new Error('Sign in did not return a valid session.') };
}

/**
 * Google OAuth via Supabase Auth (PKCE on native, browser redirect on web).
 */
export async function signInWithGoogleOAuth() {
  const redirectTo = getGoogleOAuthRedirectUrl();

  if (Platform.OS === 'web') {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectTo || undefined,
      },
    });
    return { error, cancelled: false };
  }

  const { data, error: oauthUrlError } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      // @supabase/auth-js does not forward skipBrowserRedirect onto the authorize
      // URL; GoTrue needs skip_http_redirect so the in-app browser follows the
      // provider (Google) instead of an immediate HTTP redirect chain.
      queryParams: {
        skip_http_redirect: 'true',
      },
    },
  });

  if (oauthUrlError) {
    return { error: oauthUrlError, cancelled: false };
  }
  if (!data?.url) {
    return { error: new Error('Could not start Google sign-in.'), cancelled: false };
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  if (result.type === 'cancel' || result.type === 'dismiss') {
    return { error: null, cancelled: true };
  }

  if (result.type !== 'success' || !result.url) {
    return { error: new Error('Google sign-in was not completed.'), cancelled: false };
  }

  const { error: sessionError } = await finishOAuthFromUrl(result.url);
  return { error: sessionError, cancelled: false };
}

/**
 * Client-side Supabase Auth helpers. Import from here (not `supabase` directly)
 * so call sites stay consistent and we can add logging or retries in one place.
 */

export async function signInWithEmailPassword(email, password) {
  return supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
}

export async function signUpWithEmailPassword(email, password, options = {}) {
  return supabase.auth.signUp({
    email: email.trim(),
    password,
    ...options,
  });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export function getSession() {
  return supabase.auth.getSession();
}

/**
 * True when a failed auth request is probably offline / transient — do not clear the session.
 */
function isLikelyTransientNetworkAuthError(error) {
  if (!error) {
    return false;
  }
  const name = String(error.name || '');
  if (name === 'AuthRetryableFetchError') {
    return true;
  }
  const msg = String(error.message || '').toLowerCase();
  if (msg.includes('network request failed')) {
    return true;
  }
  if (msg.includes('failed to fetch')) {
    return true;
  }
  if (msg.includes('timeout')) {
    return true;
  }
  return false;
}

/**
 * Validates the persisted session against Supabase (GET /user). If the account was removed
 * or the JWT is no longer accepted, clears the local session. Returns whether the client
 * was signed out.
 */
export async function validateSessionWithServerOrSignOut() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return false;
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (!error && user) {
    return false;
  }

  if (error && isLikelyTransientNetworkAuthError(error)) {
    return false;
  }

  await supabase.auth.signOut({ scope: 'local' });
  return true;
}

export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback);
}
