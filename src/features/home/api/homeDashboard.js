import { supabase } from '../../../lib/supabase';

const BUSINESS_PROFILE_SELECT =
  'id, profile_id, business_name, business_type, specialties, business_slug, free_bookings_count, accept_quote_req';

/**
 * @typedef {object} BusinessProfileRow
 * @property {string} id
 * @property {string | null} [profile_id] owner auth user id (`business_profiles.profile_id`)
 * @property {string | null} business_name
 * @property {string | null} business_type
 * @property {string | null} business_slug
 * @property {number | null} free_bookings_count — authoritative usage toward the free booking cap when present; UI falls back to a head-count query via `resolveFreeTierBookingUsed` (see `business_profiles`)
 * @property {boolean | null} accept_quote_req — public booking link quote requests (see `business_profiles`)
 */

/**
 * Active shop membership for this user, if any. Does not read `role`.
 *
 * @param {string} userId
 * @returns {Promise<{ data: { business_id: string; status: string } | null, error: Error | null }>}
 */
export async function fetchActiveBusinessMembership(userId) {
  if (!userId) {
    return { data: null, error: new Error('Not signed in') };
  }

  const { data, error } = await supabase
    .from('business_members')
    .select('business_id, status')
    .eq('user_id', userId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle();

  return { data, error };
}

/**
 * Owned shop first (`profile_id = auth.uid()`), else the shop from an active membership.
 *
 * @param {string} userId - auth.users.id (same as profiles.user_id)
 * @returns {Promise<{ data: BusinessProfileRow | null, error: Error | null }>}
 */
export async function fetchBusinessProfileForUser(userId) {
  const [owned, membership] = await Promise.all([
    supabase
      .from('business_profiles')
      .select(BUSINESS_PROFILE_SELECT)
      .eq('profile_id', userId)
      .maybeSingle(),
    fetchActiveBusinessMembership(userId),
  ]);

  if (owned.error) {
    return { data: null, error: owned.error };
  }
  if (owned.data) {
    return { data: owned.data, error: null };
  }
  if (membership.error) {
    return { data: null, error: membership.error };
  }
  const businessId = membership.data?.business_id;
  if (!businessId) {
    return { data: null, error: null };
  }

  const shop = await supabase
    .from('business_profiles')
    .select(BUSINESS_PROFILE_SELECT)
    .eq('id', businessId)
    .maybeSingle();

  return { data: shop.data ?? null, error: shop.error };
}

export {
  bookingTitleLine,
  fetchConfirmedBookingsFromToday,
  partitionUpcomingConfirmed,
  pickHomeSpotlight,
} from '../../bookings/api/bookings';
