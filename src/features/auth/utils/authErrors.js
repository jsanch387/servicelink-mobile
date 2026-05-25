import { safeUserFacingMessage } from '../../../utils/safeUserFacingMessage';
import {
  LOGIN_CODE_SENT_MESSAGE,
  NO_EXISTING_SERVICELINK_ACCOUNT_CODE,
  NO_EXISTING_SERVICELINK_ACCOUNT_HINT,
  NO_EXISTING_SERVICELINK_ACCOUNT_TITLE,
} from '../constants/existingAccountOnlyCopy';

const AUTH_FALLBACK = 'Something went wrong. Try again.';

function isNoExistingAccountError(error) {
  if (error == null) {
    return false;
  }
  if (typeof error === 'string') {
    return isNoExistingAccountMessage(error);
  }
  if (error.code === NO_EXISTING_SERVICELINK_ACCOUNT_CODE) {
    return true;
  }
  const code = String(error.code ?? '').toLowerCase();
  if (code === 'otp_disabled' || code === 'signup_disabled' || code === 'user_not_found') {
    return true;
  }
  const msg = String(error.message ?? '');
  return isNoExistingAccountMessage(msg);
}

function isNoExistingAccountMessage(message) {
  const lower = message.toLowerCase();
  return (
    lower.includes('no account for this email') ||
    lower.includes('no account found') ||
    lower.includes('signups not allowed for otp') ||
    lower.includes('signups not allowed') ||
    lower.includes('signup is disabled') ||
    lower.includes('user not found')
  );
}

/**
 * Normalize Supabase Auth errors (or unknown throws) for UI copy.
 */
export function getAuthErrorMessage(error) {
  if (error == null) {
    return AUTH_FALLBACK;
  }
  if (typeof error === 'string') {
    if (isNoExistingAccountMessage(error)) {
      return NO_EXISTING_SERVICELINK_ACCOUNT_TITLE;
    }
    return safeUserFacingMessage(error, { fallback: AUTH_FALLBACK });
  }

  if (isNoExistingAccountError(error)) {
    return NO_EXISTING_SERVICELINK_ACCOUNT_TITLE;
  }

  const msg = error.message?.trim();
  if (msg) {
    const lower = msg.toLowerCase();
    if (lower.includes('email not confirmed')) {
      return 'Confirm your email first, then sign in.';
    }
    if (lower.includes('token has expired') || lower.includes('otp_expired')) {
      return 'That code expired. Request a new one.';
    }
    if (
      lower.includes('invalid') &&
      (lower.includes('token') || lower.includes('otp') || lower.includes('code'))
    ) {
      return 'That code is incorrect. Check your email and try again.';
    }
    return safeUserFacingMessage(msg, { fallback: AUTH_FALLBACK });
  }
  return AUTH_FALLBACK;
}

/** Muted second line for no-account errors (login field). */
export function getAuthErrorHint(error) {
  if (isNoExistingAccountError(error)) {
    return NO_EXISTING_SERVICELINK_ACCOUNT_HINT;
  }
  return null;
}

/** Shown after send-code succeeds (avoids email enumeration). */
export function getLoginCodeSentMessage() {
  return LOGIN_CODE_SENT_MESSAGE;
}
