/** @type {const} */
export const TEAM_QUERY_ROOT = ['team'];

export function teamRosterQueryKey(userId) {
  return [...TEAM_QUERY_ROOT, 'roster', userId ?? ''];
}
