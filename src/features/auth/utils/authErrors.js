/**
 * Normalize Supabase Auth errors (or unknown throws) for UI copy.
 */
export function getAuthErrorMessage(error) {
  if (error == null) {
    return 'Something went wrong. Try again.';
  }
  if (typeof error === 'string') {
    return error;
  }
  const msg = error.message?.trim();
  if (msg) {
    return msg;
  }
  return 'Something went wrong. Try again.';
}
