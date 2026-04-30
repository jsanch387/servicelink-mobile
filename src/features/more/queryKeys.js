/** @type {const} */
export const MORE_ACCOUNT_QUERY_KEY = ['more', 'account'];
/** @type {const} */
export const MORE_NOTIFICATION_SETTINGS_QUERY_KEY = ['more', 'notification-settings'];

export function accountSettingsQueryKey(userId) {
  return [...MORE_ACCOUNT_QUERY_KEY, 'settings', userId ?? ''];
}

export function notificationSettingsQueryKey() {
  return MORE_NOTIFICATION_SETTINGS_QUERY_KEY;
}
