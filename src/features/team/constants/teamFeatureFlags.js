/**
 * Team (More → Team) rollout flags (compile-time).
 *
 * **Kill switch:** set `TEAM_FEATURE_ENABLED` to `false` to hide the Team row
 * and skip roster fetches.
 *
 * **Email-only (current):** `TEAM_EARLY_ACCESS_EMAILS` is non-empty — only those
 * logins see Team. Clear the array to open it to every owner.
 */

/** Master kill switch for the Team management UI. */
export const TEAM_FEATURE_ENABLED = true;

/**
 * Temporary early-access login emails (lowercase).
 * Non-empty = ONLY these emails get More → Team.
 * Empty = every owner with a shop sees Team.
 *
 * @type {readonly string[]}
 */
export const TEAM_EARLY_ACCESS_EMAILS = ['jesuss387@gmail.com'];
