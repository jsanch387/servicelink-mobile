import { normalizeBusinessSlug } from '../../home/utils/bookingLink';

export const MAX_BUSINESS_SLUG_LEN = 40;

/**
 * Normalizes user-typed slug for save: lowercase, hyphenated, safe charset.
 * @param {string} raw
 * @returns {string}
 */
export function sanitizeBusinessSlugForSave(raw) {
  let s = String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  s = normalizeBusinessSlug(s);
  if (s.length > MAX_BUSINESS_SLUG_LEN) {
    s = s.slice(0, MAX_BUSINESS_SLUG_LEN).replace(/-+$/g, '');
  }
  return s;
}
