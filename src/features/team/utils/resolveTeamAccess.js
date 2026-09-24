import { TEAM_EARLY_ACCESS_EMAILS, TEAM_FEATURE_ENABLED } from '../constants/teamFeatureFlags';

/**
 * @param {string | null | undefined} email
 * @returns {boolean}
 */
export function isTeamEarlyAccessEmail(email) {
  const normalized = String(email ?? '')
    .trim()
    .toLowerCase();
  if (!normalized) {
    return false;
  }
  return TEAM_EARLY_ACCESS_EMAILS.some((entry) => entry.trim().toLowerCase() === normalized);
}

/**
 * Whether this login can see More → Team.
 *
 * 1. **Email-only** — allowlist non-empty. Only those logins get `canSeeTeam`.
 * 2. **Open** — clear the allowlist. Any signed-in owner with a shop sees Team
 *    (shop check stays in `useTeamMembersUi`).
 *
 * @param {{
 *   enabled?: boolean;
 *   email?: string | null;
 *   restrictToEarlyAccess?: boolean;
 * }} [params]
 * @returns {{ featureEnabled: boolean; canSeeTeam: boolean }}
 */
export function resolveTeamAccess({
  enabled = TEAM_FEATURE_ENABLED,
  email = null,
  restrictToEarlyAccess = TEAM_EARLY_ACCESS_EMAILS.length > 0,
} = {}) {
  if (!enabled) {
    return { featureEnabled: false, canSeeTeam: false };
  }
  if (isTeamEarlyAccessEmail(email)) {
    return { featureEnabled: true, canSeeTeam: true };
  }
  if (restrictToEarlyAccess) {
    return { featureEnabled: false, canSeeTeam: false };
  }
  return { featureEnabled: true, canSeeTeam: true };
}
