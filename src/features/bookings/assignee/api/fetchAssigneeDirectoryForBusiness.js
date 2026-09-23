import { supabase } from '../../../../lib/supabase';
import { normalizeEmailForDedupe } from '../../../../utils/email';
import { canShowAssigneeControl } from '../utils/mapBookingAssignees';
import { buildAssigneesFromShopRoster } from '../utils/buildAssigneesFromShopRoster';

/**
 * Shop people keyed for booking-list display. Same source as the assignee picker.
 *
 * @param {string | null | undefined} businessId
 * @param {{ userId?: string | null; name?: string | null; email?: string | null } | null} [viewer]
 * @returns {Promise<{
 *   assignees: import('../utils/mapBookingAssignees').BookingAssignee[];
 *   nameByUserId: Map<string, string>;
 *   canAssign: boolean;
 * }>}
 */
export async function fetchAssigneeDirectoryForBusiness(businessId, viewer = null) {
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
    fetchTeamInvitesForBusiness(id, viewer),
  ]);

  if (shopRes.error || !shopRes.data?.profile_id) {
    return empty;
  }

  const viewerId = String(viewer?.userId ?? '').trim();
  const viewerEmail = normalizeEmailForDedupe(viewer?.email) ?? '';
  const profileByUserId = new Map();
  if (viewerId && viewerEmail) {
    profileByUserId.set(viewerId, { name: '', email: viewerEmail });
  }

  const assignees = buildAssigneesFromShopRoster({
    ownerUserId: shopRes.data.profile_id,
    members: membersRes.data ?? [],
    invites: invitesRes,
    profileByUserId,
  });
  return {
    assignees,
    nameByUserId: new Map(assignees.map((row) => [row.userId, row.label])),
    canAssign: canShowAssigneeControl(assignees),
  };
}

const TEAM_INVITE_COLUMNS = 'email, name, accepted_user_id, status';

/**
 * Shop-wide invites, plus the signed-in person's row if RLS hid it from the list.
 *
 * @param {string} businessId
 * @param {{ userId?: string | null; email?: string | null } | null | undefined} viewer
 * @returns {Promise<Array<{ email?: string | null; name?: string | null; accepted_user_id?: string | null; status?: string | null }>>}
 */
async function fetchTeamInvitesForBusiness(businessId, viewer) {
  const shopRes = await supabase
    .from('team_invites')
    .select(TEAM_INVITE_COLUMNS)
    .eq('business_id', businessId);
  const invites = [...(shopRes.error ? [] : (shopRes.data ?? []))];

  const viewerId = String(viewer?.userId ?? '').trim();
  const viewerEmail = normalizeEmailForDedupe(viewer?.email);
  const hasViewerInvite = invites.some((row) => {
    const acceptedId = typeof row.accepted_user_id === 'string' ? row.accepted_user_id.trim() : '';
    const email = normalizeEmailForDedupe(row.email);
    return (viewerId && acceptedId === viewerId) || (viewerEmail && email === viewerEmail);
  });
  if (hasViewerInvite || (!viewerId && !viewerEmail)) {
    return invites;
  }

  const extras = await Promise.all([
    viewerId
      ? supabase
          .from('team_invites')
          .select(TEAM_INVITE_COLUMNS)
          .eq('business_id', businessId)
          .eq('accepted_user_id', viewerId)
      : Promise.resolve({ data: [], error: null }),
    viewerEmail
      ? supabase
          .from('team_invites')
          .select(TEAM_INVITE_COLUMNS)
          .eq('business_id', businessId)
          .eq('email', viewerEmail)
      : Promise.resolve({ data: [], error: null }),
  ]);
  for (const extra of extras) {
    if (extra.error) {
      continue;
    }
    invites.push(...(extra.data ?? []));
  }
  return invites;
}
