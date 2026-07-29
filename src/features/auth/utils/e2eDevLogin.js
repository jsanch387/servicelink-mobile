/**
 * Dev-only auto sign-in for Maestro E2E.
 *
 * Enabled only when ALL of:
 * - `__DEV__` is true (never release / App Store builds)
 * - `EXPO_PUBLIC_E2E_LOGIN=true`
 * - `EXPO_PUBLIC_E2E_LOGIN_EMAIL` + `EXPO_PUBLIC_E2E_LOGIN_PASSWORD` set
 *
 * Put credentials in `.env.local` (gitignored). Restart Metro after changing env.
 * Account must already have a `profiles` row and completed onboarding or the app
 * will not reach Home.
 */

import { signInWithEmailPassword } from '../api/auth';

function normalizeEmail(email) {
  return String(email ?? '')
    .trim()
    .toLowerCase();
}

export function getE2eLoginEmail() {
  return normalizeEmail(process.env.EXPO_PUBLIC_E2E_LOGIN_EMAIL);
}

export function getE2eLoginPassword() {
  return String(process.env.EXPO_PUBLIC_E2E_LOGIN_PASSWORD ?? '');
}

export function isE2eDevLoginEnabled() {
  if (typeof __DEV__ === 'undefined' || !__DEV__) {
    return false;
  }
  const flag = String(process.env.EXPO_PUBLIC_E2E_LOGIN ?? '')
    .trim()
    .toLowerCase();
  if (flag !== 'true' && flag !== '1') {
    return false;
  }
  return Boolean(getE2eLoginEmail() && getE2eLoginPassword());
}

/**
 * Signs in with E2E credentials when enabled. No-op otherwise.
 * @returns {{ attempted: boolean, session: object | null, error: Error | null }}
 */
export async function tryE2eDevLogin() {
  if (!isE2eDevLoginEnabled()) {
    return { attempted: false, session: null, error: null };
  }

  const email = getE2eLoginEmail();
  const password = getE2eLoginPassword();
  const { data, error } = await signInWithEmailPassword(email, password);

  if (error) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.warn('[e2e] Dev login failed:', error?.message ?? error);
    }
    return { attempted: true, session: null, error };
  }

  return {
    attempted: true,
    session: data?.session ?? null,
    error: null,
  };
}
