const TRANSIENT_ERROR_SNIPPETS = [
  'network',
  'timeout',
  'timed out',
  'fetch',
  'socket',
  '503',
  '502',
  '500',
  'rate limit',
  'too many requests',
];

/**
 * Retry only once and only for likely transient failures.
 * This avoids hammering the DB for deterministic errors (not found, RLS, validation, etc).
 *
 * @param {number} failureCount
 * @param {unknown} error
 */
export function shouldRetryBookingsQuery(failureCount, error) {
  if (failureCount >= 1) {
    return false;
  }
  const message = String(error?.message ?? '').toLowerCase();
  if (!message) {
    return false;
  }
  return TRANSIENT_ERROR_SNIPPETS.some((snippet) => message.includes(snippet));
}
