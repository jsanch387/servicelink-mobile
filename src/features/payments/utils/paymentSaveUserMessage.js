/**
 * Normalize React Query `saveError` strings, `Error` objects, or unknown throws.
 * @param {unknown} source
 * @returns {string}
 */
export function normalizePaymentSaveErrorMessage(source) {
  if (source == null) return '';
  if (typeof source === 'string') return source.trim();
  if (typeof source === 'object' && 'message' in source && typeof source.message === 'string') {
    return String(source.message).trim();
  }
  return String(source).trim();
}

/**
 * Short, user-facing copy for payment settings save failures (alerts + inline errors).
 *
 * @param {unknown} source
 * @returns {string}
 */
export function getPaymentSaveUserMessage(source) {
  const raw = normalizePaymentSaveErrorMessage(source);
  const m = raw.toLowerCase();

  if (
    m.includes('no payment settings row') ||
    m.includes('turn on servicelink checkout') ||
    m.includes('payment settings row')
  ) {
    return 'Turn on ServiceLink checkout on the web first, then try saving again.';
  }

  if (m.includes('missing business')) {
    return 'Something went wrong. Go back and open Payments again.';
  }

  if (
    /network|failed to fetch|internet|offline|timeout|timed out|econnaborted|enotfound|fetch/i.test(
      m,
    )
  ) {
    return "Can't reach the server right now. Check your connection and try again.";
  }

  if (
    /rls|permission denied|not authorized|unauthorized|forbidden|row-level security|pgrst301|42501/i.test(
      m,
    )
  ) {
    return "We couldn't update these settings. If this keeps happening, contact support.";
  }

  return "We couldn't save your payment settings. Please try again.";
}
