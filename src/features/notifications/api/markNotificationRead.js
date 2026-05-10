import { supabase } from '../../../lib/supabase';

/**
 * @param {string} userId
 * @param {string} notificationId
 */
export async function markNotificationRead(userId, notificationId) {
  if (!userId || !notificationId) {
    return;
  }

  const readAt = new Date().toISOString();
  const { error } = await supabase
    .from('notifications')
    .update({ read: true, read_at: readAt })
    .eq('id', notificationId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(error.message);
  }
}
