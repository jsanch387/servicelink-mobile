/**
 * Stripe Terminal returns this when collect/confirm runs without a live reader
 * (often after our in-memory "warm" cache is stale).
 *
 * @param {string | null | undefined} code
 * @param {string | null | undefined} message
 */
export function isTapToPayReaderNotConnectedError(code, message) {
  const normalizedCode = String(code ?? '')
    .trim()
    .toUpperCase();
  const lower = String(message ?? '').toLowerCase();
  if (
    normalizedCode.includes('NOT_CONNECTED') ||
    normalizedCode === 'READER_NOT_CONNECTED' ||
    normalizedCode === 'NOTCONNECTED'
  ) {
    return true;
  }
  return lower.includes('no reader is connected') || lower.includes('connect to a reader');
}
