/** @type {const} */
export const MORE_ACCOUNT_QUERY_KEY = ['more', 'account'];

export function accountSettingsQueryKey(userId) {
  return [...MORE_ACCOUNT_QUERY_KEY, 'settings', userId ?? ''];
}
