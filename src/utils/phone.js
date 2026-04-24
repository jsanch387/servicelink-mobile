/**
 * Shared phone helpers.
 * Current default behavior assumes US numbers while keeping a safe fallback for others.
 */

function digitsOnly(raw) {
  return String(raw ?? '').replace(/\D/g, '');
}

/**
 * Pretty-print a stored phone for UI.
 * - US 10 digits: (555) 123-4567
 * - US 11 digits starting with 1: +1 (555) 123-4567
 * - Other values: +digits fallback when possible
 *
 * @param {string | null | undefined} raw
 * @returns {string}
 */
export function formatPhoneForDisplay(raw) {
  if (raw == null || typeof raw !== 'string') {
    return '';
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    return '';
  }
  const digits = digitsOnly(trimmed);
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

/**
 * Normalize stored phone for `sms:` URLs (keeps leading +, strips spaces/punctuation).
 * @param {string | null | undefined} raw
 * @returns {string | null}
 */
export function phoneForSmsUri(raw) {
  if (raw == null || typeof raw !== 'string') {
    return null;
  }
  let t = raw.trim().replace(/[\s().-]/g, '');
  if (!t) {
    return null;
  }
  if (t.startsWith('+')) {
    return t;
  }
  const digits = digitsOnly(t);
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  if (digits.length >= 11) {
    return `+${digits}`;
  }
  if (digits.length > 0) {
    return `+${digits}`;
  }
  return null;
}
