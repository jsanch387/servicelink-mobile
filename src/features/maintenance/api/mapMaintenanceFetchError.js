/**
 * User-facing copy for maintenance Supabase read failures (before generic sanitization).
 *
 * @param {unknown} error
 * @returns {string}
 */
export function mapMaintenanceFetchError(error) {
  const message =
    error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
      ? error.message.trim()
      : '';
  const code =
    error && typeof error === 'object' && 'code' in error ? String(error.code ?? '') : '';
  const lower = message.toLowerCase();

  if (
    code === '42501' ||
    code === 'PGRST301' ||
    lower.includes('permission denied') ||
    lower.includes('row-level security')
  ) {
    return 'We could not load maintenance offers for this account.';
  }

  if (lower.includes('does not exist') && lower.includes('column')) {
    return 'Maintenance data is temporarily unavailable. Pull down to refresh.';
  }

  if (message) {
    return message;
  }

  return 'Could not load maintenance offers.';
}
