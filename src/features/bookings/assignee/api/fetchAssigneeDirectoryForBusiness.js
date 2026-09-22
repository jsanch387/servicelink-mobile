import { supabase } from '../../../../lib/supabase';
import { canShowAssigneeControl } from '../utils/mapBookingAssignees';
import { buildAssigneesFromShopRoster } from '../utils/buildAssigneesFromShopRoster';

/**
 * Shop people keyed for booking-list display. Same source as the assignee picker.
 *
 * @param {string | null | undefined} businessId
 * @returns {Promise<{
 *   assignees: import('../utils/mapBookingAssignees').BookingAssignee[];
 *   nameByUserId: Map<string, string>;
 *   canAssign: boolean;
 * }>}
 */
export async function fetchAssigneeDirectoryForBusiness(businessId) {
  const empty = {
    assignees: [],
    nameByUserId: new Map(),
    canAssign: false,
  };
  const id = typeof businessId === 'string' ? businessId.trim() : '';
  if (!id) {
    return empty;
  }

  const [shopRes, membersRes, invitesRes] = await Promise.all([
    supabase.from('business_profiles').select('profile_id').eq('id', id).maybeSingle(),
    supabase
      .from('business_members')
      .select('user_id, status')
      .eq('business_id', id)
      .in('status', ['active', 'removed']),
    supabase
      .from('team_invites')
      .select('email, name, accepted_user_id, status')
      .eq('business_id', id),
  ]);

  if (shopRes.error || !shopRes.data?.profile_id) {
    return empty;
  }

  const assignees = buildAssigneesFromShopRoster({
    ownerUserId: shopRes.data.profile_id,
    members: membersRes.data ?? [],
    invites: invitesRes.data ?? [],
  });
  return {
    assignees,
    nameByUserId: new Map(assignees.map((row) => [row.userId, row.label])),
    canAssign: canShowAssigneeControl(assignees),
  };
}
