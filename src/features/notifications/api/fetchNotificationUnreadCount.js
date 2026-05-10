import { supabase } from '../../../lib/supabase';

/**
 * @param {string} userId
 * @returns {Promise<number>}
 */
export async function fetchNotificationUnreadCount(userId) {
  if (!userId) {
    return 0;
  }

  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}
