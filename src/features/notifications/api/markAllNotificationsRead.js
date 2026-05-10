import { supabase } from '../../../lib/supabase';

/**
 * @param {string} userId
 */
export async function markAllNotificationsRead(userId) {
  if (!userId) {
    return;
  }

  const readAt = new Date().toISOString();
  const { error } = await supabase
    .from('notifications')
    .update({ read: true, read_at: readAt })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) {
    throw new Error(error.message);
  }
}
