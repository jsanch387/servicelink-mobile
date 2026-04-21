/**
 * Pretty-print a stored phone for UI (US 10/11-digit friendly; otherwise +digits).
 * @param {string | null | undefined} raw
 * @returns {string} Empty when missing; never throws.
 */
export function formatPhoneForDisplay(raw) {
  if (raw == null || typeof raw !== 'string') {
    return '';
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    return '';
  }
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 0) {
    return trimmed;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits[0] === '1') {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  if (trimmed.startsWith('+') || digits.length > 10) {
    return `+${digits}`;
  }
  return trimmed;
}
