import { supabase } from '../../../lib/supabase';

/**
 * @typedef {object} BusinessProfileRow
 * @property {string} id
 * @property {string | null} business_name
 * @property {string | null} business_type
 * @property {string | null} business_slug
 * @property {number | null} profile_views
 */

/**
 * @param {string} userId - auth.users.id (same as profiles.user_id)
 * @returns {Promise<{ data: BusinessProfileRow | null, error: Error | null }>}
 */
export async function fetchBusinessProfileForUser(userId) {
  const { data, error } = await supabase
    .from('business_profiles')
    .select('id, business_name, business_type, business_slug, profile_views')
    .eq('profile_id', userId)
    .maybeSingle();

  return { data, error };
}

export {
  bookingTitleLine,
  fetchConfirmedBookingsFromToday,
  partitionUpcomingConfirmed,
  pickHomeSpotlight,
} from '../../bookings/api/bookings';
