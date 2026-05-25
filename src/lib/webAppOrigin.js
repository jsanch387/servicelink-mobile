import Constants from 'expo-constants';
import { PATHS } from '../routes/routes';

const PROD_WEB_ORIGIN = 'https://myservicelink.app';

/**
 * Base URL for the Next.js app (same origin as `/api/*`). No trailing slash.
 * @see EXPO_PUBLIC_WEB_APP_URL in `.env` and `extra.webAppUrl` in `app.config.js`
 */
export function getWebAppOrigin() {
  const fromEnv = String(process.env.EXPO_PUBLIC_WEB_APP_URL ?? '').trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, '');
  }
  const fromExtra = String(Constants.expoConfig?.extra?.webAppUrl ?? '').trim();
  if (fromExtra) {
    return fromExtra.replace(/\/$/, '');
  }
  return '';
}

/**
 * Full URL for the web forgot-password page (opened with Linking.openURL).
 * Override with EXPO_PUBLIC_WEB_FORGOT_PASSWORD_URL when needed (exact URL).
 */
export function getWebForgotPasswordUrl() {
  const explicit = String(process.env.EXPO_PUBLIC_WEB_FORGOT_PASSWORD_URL ?? '').trim();
  if (explicit) {
    return explicit;
  }
  const origin = getWebAppOrigin() || PROD_WEB_ORIGIN;
  return `${origin.replace(/\/$/, '')}${PATHS.AUTH_FORGOT_PASSWORD}`;
}

/**
 * Full URL for the hosted privacy policy page.
 * Override with `EXPO_PUBLIC_WEB_PRIVACY_URL` when needed.
 */
export function getWebPrivacyPolicyUrl() {
  const explicit = String(process.env.EXPO_PUBLIC_WEB_PRIVACY_URL ?? '').trim();
  if (explicit) {
    return explicit;
  }
  const origin = getWebAppOrigin() || PROD_WEB_ORIGIN;
  return `${origin.replace(/\/$/, '')}${PATHS.PRIVACY_POLICY}`;
}

/**
 * Full URL for the hosted Terms of Service page.
 * Override with `EXPO_PUBLIC_WEB_TERMS_URL` when needed.
 */
export function getWebTermsOfServiceUrl() {
  const explicit = String(process.env.EXPO_PUBLIC_WEB_TERMS_URL ?? '').trim();
  if (explicit) {
    return explicit;
  }
  const origin = getWebAppOrigin() || PROD_WEB_ORIGIN;
  return `${origin.replace(/\/$/, '')}${PATHS.TERMS_OF_SERVICE}`;
}

/**
 * Web sign-in page — account administration on web, not in the iOS app.
 */
export function getWebAccountAdminUrl() {
  const origin = (getWebAppOrigin() || PROD_WEB_ORIGIN).replace(/\/$/, '');
  return `${origin}${PATHS.LOGIN}`;
}

/**
 * Web sign-up page — account creation on web, not in the iOS app.
 */
export function getWebSignUpUrl() {
  const explicit = String(process.env.EXPO_PUBLIC_WEB_SIGNUP_URL ?? '').trim();
  if (explicit) {
    return explicit;
  }
  const origin = (getWebAppOrigin() || PROD_WEB_ORIGIN).replace(/\/$/, '');
  return `${origin}${PATHS.WEB_SIGN_UP}`;
}

/** @deprecated Use {@link getWebAccountAdminUrl} */
export function getWebPlanManagementUrl() {
  return getWebAccountAdminUrl();
}
