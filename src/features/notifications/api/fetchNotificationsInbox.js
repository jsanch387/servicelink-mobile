import { supabase } from '../../../lib/supabase';
import { mapNotificationRowToInboxItem } from '../utils/notificationInboxPresentation';

const NOTIFICATION_SELECT =
  'id, user_id, type, reference_type, reference_id, title, body, read, read_at, created_at, metadata, dedupe_key';

/** Max rows for the "New" (unread-only) feed. */
export const NOTIFICATIONS_UNREAD_LIMIT = 40;

/** Page size for the "Recent" (history) feed. */
export const NOTIFICATIONS_RECENT_PAGE_SIZE = 25;

/**
 * @param {string} userId
 * @returns {Promise<ReturnType<typeof mapNotificationRowToInboxItem>[]>}
 */
export async function fetchUnreadNotificationsInbox(userId) {
  if (!userId) {
    return [];
  }

  const { data, error } = await supabase
    .from('notifications')
    .select(NOTIFICATION_SELECT)
    .eq('user_id', userId)
    .eq('read', false)
    .order('created_at', { ascending: false })
    .limit(NOTIFICATIONS_UNREAD_LIMIT);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapNotificationRowToInboxItem(row));
}

/**
 * One page of recent notifications (read + unread), newest first.
 * @param {string} userId
 * @param {number} pageOffset
 * @returns {Promise<ReturnType<typeof mapNotificationRowToInboxItem>[]>}
 */
export async function fetchRecentNotificationsPage(userId, pageOffset) {
  if (!userId) {
    return [];
  }

  const from = pageOffset;
  const to = pageOffset + NOTIFICATIONS_RECENT_PAGE_SIZE - 1;

  const { data, error } = await supabase
    .from('notifications')
    .select(NOTIFICATION_SELECT)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapNotificationRowToInboxItem(row));
}
