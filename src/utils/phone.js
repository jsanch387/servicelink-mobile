/**
 * Shared phone helpers.
 * US NANP: store **10 digits only** (e.g. `5123214324`); display as `(512) 321-4324`.
 * SMS/tel URLs still use `+1` + national digits via {@link phoneForSmsUri}.
 */

/** Formatted US NANP max length: `(512) 321-4324` → 14 chars */
export const US_NANP_FORMATTED_MAX_LENGTH = 14;

function digitsOnly(raw) {
  return String(raw ?? '').replace(/\D/g, '');
}

/** First digit of US NANP area code or exchange (NXX): N is 2–9. */
function isNanpNxxLeadingDigit(char) {
  return char >= '2' && char <= '9';
}

/**
 * True when `digits10` is exactly 10 digits and satisfies basic NANP NXX–NXX rules
 * (leading digit of area code and of exchange are 2–9).
 *
 * @param {string} digits10
 * @returns {boolean}
 */
export function isValidUsNanpTenDigits(digits10) {
  if (digits10 == null || typeof digits10 !== 'string' || digits10.length !== 10) {
    return false;
  }
  if (!/^\d{10}$/.test(digits10)) {
    return false;
  }
  return isNanpNxxLeadingDigit(digits10[0]) && isNanpNxxLeadingDigit(digits10[3]);
}

/**
 * Reduce a digit string (max 10) so every filled prefix satisfies NANP NXX rules; fixes bad pastes
 * by trimming trailing digits or stripping invalid leading area-code digits.
 *
 * @param {string} digitsOnlyRaw digits only, already truncated to ≤10 and leading country 1 stripped
 * @returns {string}
 */
function sanitizeNanpDigitsProgressive(digitsOnlyRaw) {
  let d = digitsOnlyRaw.slice(0, 10);
  for (;;) {
    if (d.length === 0) break;
    if (!isNanpNxxLeadingDigit(d[0])) {
      d = d.slice(1);
      continue;
    }
    if (d.length >= 4 && !isNanpNxxLeadingDigit(d[3])) {
      d = d.slice(0, -1);
      continue;
    }
    if (d.length === 10 && !isValidUsNanpTenDigits(d)) {
      d = d.slice(0, -1);
      continue;
    }
    break;
  }
  return d;
}

/**
 * Empty → OK to save (clears phone). Digits only: must be exactly 10 valid NANP or user must clear the field.
 *
 * @param {string | null | undefined} raw
 * @returns {string | null} error message, or null when input is acceptable for save
 */
export function getPhoneInputValidationMessage(raw) {
  const trimmed = String(raw ?? '').trim();
  if (!trimmed) {
    return null;
  }
  const d = canonicalNanpDigits(trimmed);
  if (d.length === 0) {
    return null;
  }
  if (d.length < 10 || !isValidUsNanpTenDigits(d)) {
    return 'Enter a valid phone number, or leave empty.';
  }
  return null;
}

/**
 * Compare NANP numbers consistently: `(555) …`, `5551234567`, `+15551234567`, `15551234567` → same 10-digit string.
 *
 * @param {string | null | undefined} raw
 * @returns {string}
 */
export function canonicalNanpDigits(raw) {
  let d = digitsOnly(raw);
  if (d.length === 11 && d[0] === '1') {
    return d.slice(1);
  }
  return d;
}

/**
 * US NANP while typing: **at most 10 digits**, formatted as `(212) 555-1234` (no +1).
 * Extra pasted digits are dropped. A single leading `1` (country code) is removed when it produces 11+ digits.
 *
 * @param {string | null | undefined} text
 * @returns {string}
 */
export function formatPhoneInputAsYouType(text) {
  let d = digitsOnly(text);
  if (d.length >= 11 && d[0] === '1') {
    d = d.slice(1);
  }
  d = d.slice(0, 10);
  d = sanitizeNanpDigitsProgressive(d);
  return formatPartialUsNanp(d);
}

/**
 * @param {string} digitsOnlyTen Max length 10
 */
function formatPartialUsNanp(digitsOnlyTen) {
  const d = digitsOnlyTen;
  const len = d.length;
  if (len === 0) return '';
  if (len <= 3) return `(${d}`;
  if (len <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

/**
 * Pretty-print stored or legacy phone values for UI (US NANP shown without +1).
 *
 * @param {string | null | undefined} raw
 * @returns {string}
 */
/**
 * Owner-facing privacy mask — area code + last four only.
 * `(512) 321-4324` → `(512) ***-4324`
 *
 * @param {string | null | undefined} raw
 * @returns {string}
 */
export function maskPhoneForDisplay(raw) {
  const digits = canonicalNanpDigits(raw);
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ***-${digits.slice(6)}`;
  }
  const formatted = formatPhoneForDisplay(raw).trim();
  if (!formatted) {
    return '';
  }
  const allDigits = digitsOnly(raw);
  if (allDigits.length >= 4) {
    return `***-${allDigits.slice(-4)}`;
  }
  return formatted;
}

export function formatPhoneForDisplay(raw) {
  if (raw == null || typeof raw !== 'string') {
    return '';
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    return '';
  }
  const d = digitsOnly(trimmed);
  if (d.length === 0) {
    return trimmed;
  }

  const us10 = d.length === 11 && d[0] === '1' ? d.slice(1) : d;
  if (us10.length === 10) {
    return `(${us10.slice(0, 3)}) ${us10.slice(3, 6)}-${us10.slice(6)}`;
  }
  if (trimmed.startsWith('+') || d.length > 10) {
    return `+${d}`;
  }
  return d;
}

/**
 * Persist **10 NANP digits only** (no spaces, parentheses, or `+1`).
 * Incomplete numbers → `null`.
 *
 * @param {string | null | undefined} raw Formatted `(555) …`, typed digits, legacy `+1…`.
 * @returns {string | null}
 */
export function normalizePhoneForDatabase(raw) {
  if (raw == null || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let d = digitsOnly(trimmed);
  if (d.length === 11 && d[0] === '1') {
    d = d.slice(1);
  }
  if (d.length === 10) {
    return isValidUsNanpTenDigits(d) ? d : null;
  }
  return null;
}

/**
 * Normalize stored phone for `sms:` URLs (E.164 with `+1` for 10-digit US).
 * Accepts legacy E.164 or plain 10-digit national.
 *
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
    return isValidUsNanpTenDigits(digits) ? `+1${digits}` : null;
  }
  if (digits.length >= 11) {
    return `+${digits}`;
  }
  if (digits.length > 0) {
    return `+${digits}`;
  }
  return null;
}
