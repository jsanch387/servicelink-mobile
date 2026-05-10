/**
 * @param {string | null | undefined} userId
 * @param {'unread' | 'recent'} [scope]
 */
export function notificationsInboxQueryKey(userId, scope = 'unread') {
  return ['notifications', 'inbox', userId ?? 'anon', scope];
}

/**
 * @param {string | null | undefined} userId
 */
export function notificationUnreadCountQueryKey(userId) {
  return ['notifications', 'unread-count', userId ?? 'anon'];
}
