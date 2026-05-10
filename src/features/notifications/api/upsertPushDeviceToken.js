import { supabase } from '../../../lib/supabase';

/**
 * Persists the Expo push token for the signed-in user (one row per user+token).
 * Requires table `user_push_tokens` — see `src/features/notifications/docs/detailer-notifications-guide.md`.
 *
 * @param {string} userId
 * @param {string} expoPushToken
 * @param {string} platform `ios` | `android`
 */
export async function upsertPushDeviceToken(userId, expoPushToken, platform) {
  if (!userId || !expoPushToken) {
    return;
  }

  const { error } = await supabase.from('user_push_tokens').upsert(
    {
      user_id: userId,
      expo_push_token: expoPushToken,
      platform,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,expo_push_token' },
  );

  if (error) {
    throw new Error(error.message);
  }
}
