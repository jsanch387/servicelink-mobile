import { normalizeEmailForDedupe } from '../../../../utils/email';

/**
 * @param {{
 *   ownerUserId?: string | null;
 *   members?: Array<{ user_id?: string | null; status?: string | null }>;
 *   invites?: Array<{
 *     email?: string | null;
 *     name?: string | null;
 *     accepted_user_id?: string | null;
 *   }>;
 * }} input
 * @returns {import('./mapBookingAssignees').BookingAssignee[]}
 */
export function buildAssigneesFromShopRoster({ ownerUserId, members = [], invites = [] } = {}) {
  const ownerId = typeof ownerUserId === 'string' ? ownerUserId.trim() : '';
  if (!ownerId) {
    return [];
  }

  const emailByUserId = new Map();
  const nameByUserId = new Map();
  for (const row of invites ?? []) {
    const email = normalizeEmailForDedupe(row.email) ?? '';
    const name = String(row.name ?? '').trim();
    if (row.accepted_user_id && email) {
      emailByUserId.set(row.accepted_user_id, email);
      if (name) {
        nameByUserId.set(row.accepted_user_id, name);
      }
    }
  }

  const assignees = [{ userId: ownerId, label: 'Owner', kind: 'owner' }];
  const seen = new Set([ownerId]);

  for (const row of members ?? []) {
    const memberId = typeof row.user_id === 'string' ? row.user_id.trim() : '';
    if (!memberId || seen.has(memberId)) {
      continue;
    }
    const email = emailByUserId.get(memberId) || '';
    assignees.push({
      userId: memberId,
      label: nameByUserId.get(memberId) || email || 'Member',
      kind: row.status === 'removed' ? 'former' : 'member',
    });
    seen.add(memberId);
  }

  for (const [memberId, email] of emailByUserId) {
    if (!memberId || seen.has(memberId)) {
      continue;
    }
    assignees.push({
      userId: memberId,
      label: nameByUserId.get(memberId) || email,
      kind: 'former',
    });
    seen.add(memberId);
  }

  return assignees;
}
