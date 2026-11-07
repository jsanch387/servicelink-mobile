import { TAX_SETTINGS_EARLY_ACCESS_EMAILS } from '../constants/taxFeatureFlags';

/**
 * @param {string | null | undefined} email
 * @returns {boolean}
 */
export function canSeeTaxSettings(email) {
  if (TAX_SETTINGS_EARLY_ACCESS_EMAILS.length === 0) return true;
  const normalized = String(email ?? '')
    .trim()
    .toLowerCase();
  if (!normalized) return false;
  return TAX_SETTINGS_EARLY_ACCESS_EMAILS.some(
    (entry) => entry.trim().toLowerCase() === normalized,
  );
}
