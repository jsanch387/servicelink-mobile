/**
 * @param {string | null | undefined} email
 * @returns {boolean}
 */
export function isValidEmailFormat(email) {
  const t = String(email ?? '').trim();
  if (!t) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
}

/**
 * Lowercase trimmed email for dedupe / `email_normalized` (matches web + booking upsert).
 * @param {string | null | undefined} email
 * @returns {string | null}
 */
export function normalizeEmailForDedupe(email) {
  const t = String(email ?? '')
    .trim()
    .toLowerCase();
  return t || null;
}
