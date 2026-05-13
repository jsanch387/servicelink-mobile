import { safeUserFacingMessage } from '../../../utils/safeUserFacingMessage';

const AUTH_FALLBACK = 'Something went wrong. Try again.';

/**
 * Normalize Supabase Auth errors (or unknown throws) for UI copy.
 */
export function getAuthErrorMessage(error) {
  if (error == null) {
    return AUTH_FALLBACK;
  }
  if (typeof error === 'string') {
    return safeUserFacingMessage(error, { fallback: AUTH_FALLBACK });
  }
  const msg = error.message?.trim();
  if (msg) {
    const lower = msg.toLowerCase();
    if (lower.includes('email not confirmed')) {
      return 'Confirm your email first, then sign in.';
    }
    return safeUserFacingMessage(msg, { fallback: AUTH_FALLBACK });
  }
  return AUTH_FALLBACK;
}
