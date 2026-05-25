/**
 * @param {unknown} error
 * @returns {string}
 */
export function mapMaintenanceDeleteError(error) {
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
    return 'You do not have permission to remove this maintenance detail.';
  }

  if (message) {
    return message;
  }

  return 'Could not remove this maintenance detail. Try again.';
}
