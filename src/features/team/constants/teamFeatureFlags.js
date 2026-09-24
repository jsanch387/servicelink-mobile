/**
 * Team (More → Team) rollout flags (compile-time).
 *
 * **Kill switch:** set `TEAM_FEATURE_ENABLED` to `false` to hide the Team row
 * and skip roster fetches.
 *
 * **Open:** `TEAM_EARLY_ACCESS_EMAILS` is empty — every owner with a shop sees Team.
 * Put emails back in the array to restrict it again.
 */

/** Master kill switch for the Team management UI. */
export const TEAM_FEATURE_ENABLED = true;

/**
 * Optional early-access login emails (lowercase).
 * Empty = every owner with a shop sees More → Team.
 * Non-empty = ONLY these emails get Team.
 *
 * @type {readonly string[]}
 */
export const TEAM_EARLY_ACCESS_EMAILS = [];
