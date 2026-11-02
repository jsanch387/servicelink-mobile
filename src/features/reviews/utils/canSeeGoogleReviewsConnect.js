import { GOOGLE_REVIEWS_EARLY_ACCESS_EMAILS } from '../constants/googleReviewsFeatureFlags';

/**
 * Whether this login should see the Google connect card.
 * An empty allowlist opens the card to every account.
 *
 * @param {string | null | undefined} email
 * @param {readonly string[]} [allowlist]
 * @returns {boolean}
 */
export function canSeeGoogleReviewsConnect(email, allowlist = GOOGLE_REVIEWS_EARLY_ACCESS_EMAILS) {
  if (allowlist.length === 0) return true;
  const normalized = String(email ?? '')
    .trim()
    .toLowerCase();
  if (!normalized) return false;
  return allowlist.some((entry) => entry.trim().toLowerCase() === normalized);
}
