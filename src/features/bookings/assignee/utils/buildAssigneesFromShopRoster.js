import { normalizeEmailForDedupe } from '../../../../utils/email';

/**
 * @param {unknown} label
 * @returns {boolean}
 */
export function isPlaceholderAssigneeLabel(label) {
  const value = String(label ?? '')
    .trim()
    .toLowerCase();
  return !value || value === 'member' || value === 'team member';
}

/**
 * @param {{
 *   ownerUserId?: string | null;
 *   members?: Array<{ user_id?: string | null; status?: string | null }>;
 *   invites?: Array<{
 *     email?: string | null;
 *     name?: string | null;
 *     accepted_user_id?: string | null;
 *   }>;
 *   profileByUserId?: Map<string, { name?: string | null; email?: string | null }>;
 * }} input
 * @returns {import('./mapBookingAssignees').BookingAssignee[]}
 */
export function buildAssigneesFromShopRoster({
  ownerUserId,
  members = [],
  invites = [],
  profileByUserId = new Map(),
} = {}) {
  const ownerId = typeof ownerUserId === 'string' ? ownerUserId.trim() : '';
  if (!ownerId) {
    return [];
  }

  const emailByUserId = new Map();
  const nameByUserId = new Map();
  const profileIdByEmail = new Map();
  for (const [userId, profile] of profileByUserId ?? []) {
    const email = normalizeEmailForDedupe(profile?.email);
    if (email) {
      profileIdByEmail.set(email, userId);
    }
  }

  for (const row of invites ?? []) {
    const email = normalizeEmailForDedupe(row.email) ?? '';
    const name = String(row.name ?? '').trim();
    const acceptedId = typeof row.accepted_user_id === 'string' ? row.accepted_user_id.trim() : '';
    const matchedId = acceptedId || (email ? profileIdByEmail.get(email) : '');
    if (!matchedId) {
      continue;
    }
    if (email) {
      emailByUserId.set(matchedId, email);
    }
    if (name) {
      nameByUserId.set(matchedId, name);
    }
  }

  const assignees = [{ userId: ownerId, label: 'Owner', kind: 'owner' }];
  const seen = new Set([ownerId]);

  for (const row of members ?? []) {
    const memberId = typeof row.user_id === 'string' ? row.user_id.trim() : '';
    if (!memberId || seen.has(memberId)) {
      continue;
    }
    const profile = profileByUserId.get(memberId);
    const profileEmail = normalizeEmailForDedupe(profile?.email) ?? '';
    const email = emailByUserId.get(memberId) || profileEmail;
    assignees.push({
      userId: memberId,
      label: nameByUserId.get(memberId) || 'Member',
      kind: row.status === 'removed' ? 'former' : 'member',
      ...(email ? { email } : {}),
    });
    seen.add(memberId);
  }

  for (const [memberId, email] of emailByUserId) {
    if (!memberId || seen.has(memberId)) {
      continue;
    }
    assignees.push({
      userId: memberId,
      label: nameByUserId.get(memberId) || 'Member',
      kind: 'former',
      ...(email ? { email } : {}),
    });
    seen.add(memberId);
  }

  return assignees;
}
