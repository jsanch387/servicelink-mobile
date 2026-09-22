import { supabase } from '../../../lib/supabase';
import { normalizeEmailForDedupe } from '../../../utils/email';

/**
 * Owners can update their shop's invites. Saves the name the owner typed
 * so Team and Assignee can show it even if the invite API ignores `name`.
 *
 * Matches email case-insensitively — the API often stores the original casing.
 *
 * @param {string | null | undefined} shopId
 * @param {string} email
 * @param {string} name
 */
export async function persistTeamInviteName(shopId, email, name) {
  const businessId = String(shopId ?? '').trim();
  const inviteEmail = normalizeEmailForDedupe(email);
  const inviteName = String(name ?? '').trim();
  if (!businessId || !inviteEmail || !inviteName) {
    return;
  }

  const { data: rows, error: findError } = await supabase
    .from('team_invites')
    .select('id, email')
    .eq('business_id', businessId)
    .eq('status', 'pending');
  if (findError) {
    throw findError;
  }

  const target = (rows ?? []).find((row) => normalizeEmailForDedupe(row?.email) === inviteEmail);
  if (!target?.id) {
    return;
  }

  const { error } = await supabase
    .from('team_invites')
    .update({ name: inviteName })
    .eq('id', target.id);
  if (error) {
    throw error;
  }
}

/**
 * Owner rename from Team details. Writes `team_invites.name` by invite id,
 * accepted user, or pending email.
 *
 * @param {string | null | undefined} shopId
 * @param {{
 *   id?: string | null;
 *   source?: string | null;
 *   userId?: string | null;
 *   email?: string | null;
 * } | null | undefined} member
 * @param {string} name
 */
export async function updateTeamMemberDisplayName(shopId, member, name) {
  const inviteName = String(name ?? '').trim();
  if (!inviteName) {
    throw new Error('Enter their name.');
  }

  if (member?.source === 'invite' && member?.id) {
    const { error } = await supabase
      .from('team_invites')
      .update({ name: inviteName })
      .eq('id', member.id);
    if (error) {
      throw error;
    }
    return;
  }

  if (member?.userId) {
    const { error } = await supabase
      .from('team_invites')
      .update({ name: inviteName })
      .eq('accepted_user_id', member.userId);
    if (error) {
      throw error;
    }
    return;
  }

  await persistTeamInviteName(shopId, member?.email, inviteName);
}
