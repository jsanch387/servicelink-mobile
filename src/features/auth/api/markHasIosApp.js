import { supabase } from '../../../lib/supabase';

/**
 * Marks the signed-in user as an iOS app user (`profiles.has_ios_app`).
 * Requires column `has_ios_app` on `profiles` — see migration in auth docs / PR SQL.
 *
 * @param {string} userId
 * @returns {Promise<void>}
 */
export async function markHasIosApp(userId) {
  if (!userId) {
    return;
  }

  const { error } = await supabase
    .from('profiles')
    .update({ has_ios_app: true })
    .eq('user_id', userId);

  if (error) {
    throw new Error(error.message);
  }
}
