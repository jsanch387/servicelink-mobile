import { MOCK_NOTIFICATIONS_INBOX } from '../data/mockNotificationsInbox';

/**
 * Loads notification inbox rows. Replace with Supabase/API when available.
 * @returns {Promise<typeof MOCK_NOTIFICATIONS_INBOX>}
 */
export async function fetchNotificationsInbox() {
  return MOCK_NOTIFICATIONS_INBOX;
}
