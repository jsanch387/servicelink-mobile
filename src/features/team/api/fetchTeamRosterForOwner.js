import { supabase } from '../../../lib/supabase';
import { mapTeamRoster } from '../utils/mapTeamRoster';

/**
 * Pending invites + active members for a shop (`business_profiles.id`).
 *
 * @param {string} shopId
 * @returns {Promise<{ shopId: string; members: object[]; error: Error | null }>}
 */
export async function fetchTeamRosterForShop(shopId) {
  const [invitesRes, membersRes] = await Promise.all([
    supabase
      .from('team_invites')
      .select('id, email, name, status, accepted_user_id, created_at')
      .eq('business_id', shopId),
    supabase
      .from('business_members')
      .select('id, user_id, role, status, created_at')
      .eq('business_id', shopId)
      .eq('status', 'active'),
  ]);

  if (invitesRes.error) {
    return { shopId, members: [], error: invitesRes.error };
  }
  if (membersRes.error) {
    return { shopId, members: [], error: membersRes.error };
  }

  return {
    shopId,
    members: mapTeamRoster({
      invites: invitesRes.data ?? [],
      members: membersRes.data ?? [],
    }),
    error: null,
  };
}

/**
 * Owner shop roster from Supabase: pending invites + active members.
 *
 * @param {string} userId auth user id (`business_profiles.profile_id`)
 * @returns {Promise<{ shopId: string | null; members: object[]; error: Error | null }>}
 */
export async function fetchTeamRosterForOwner(userId) {
  if (!userId) {
    return { shopId: null, members: [], error: new Error('Not signed in') };
  }

  const { data: shop, error: shopError } = await supabase
    .from('business_profiles')
    .select('id')
    .eq('profile_id', userId)
    .maybeSingle();

  if (shopError) {
    return { shopId: null, members: [], error: shopError };
  }
  if (!shop?.id) {
    return { shopId: null, members: [], error: null };
  }

  return fetchTeamRosterForShop(shop.id);
}
