/**
 * Stripe Terminal returns this when easyConnect runs while a reader is still
 * attached on the native side, even if our in-memory session flags are cold.
 *
 * @param {string | null | undefined} code
 * @param {string | null | undefined} message
 */
export function isTapToPayAlreadyConnectedReaderError(code, message) {
  const normalizedCode = String(code ?? '')
    .trim()
    .toUpperCase();
  const lower = String(message ?? '').toLowerCase();
  if (
    normalizedCode.includes('ALREADY_CONNECTED') ||
    normalizedCode === 'READER_ALREADY_CONNECTED' ||
    normalizedCode === 'ALREADYCONNECTED'
  ) {
    return true;
  }
  return lower.includes('already connected to a reader');
}
