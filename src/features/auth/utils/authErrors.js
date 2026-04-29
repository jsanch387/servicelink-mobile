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
    return safeUserFacingMessage(msg, { fallback: AUTH_FALLBACK });
  }
  return AUTH_FALLBACK;
}
