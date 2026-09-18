import { normalizeEmailForDedupe } from '../../../utils/email';

function sortNewestFirst(a, b) {
  return String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''));
}

/**
 * Pending invites + active members. Email for members comes from the accepted invite row.
 *
 * @param {{
 *   invites?: Array<{
 *     id?: string;
 *     email?: string | null;
 *     status?: string | null;
 *     accepted_user_id?: string | null;
 *     created_at?: string | null;
 *   }>;
 *   members?: Array<{
 *     id?: string;
 *     user_id?: string | null;
 *     status?: string | null;
 *     created_at?: string | null;
 *   }>;
 * }} raw
 */
export function mapTeamRoster(raw) {
  const emailByUserId = new Map();
  const invited = [];

  for (const row of raw?.invites ?? []) {
    const email = normalizeEmailForDedupe(row.email) ?? '';
    if (row.accepted_user_id && email) {
      emailByUserId.set(row.accepted_user_id, email);
    }
    if (row.status !== 'pending' || !row.id || !email) {
      continue;
    }
    invited.push({
      id: row.id,
      name: '',
      email,
      phone: '',
      status: 'invited',
      source: 'invite',
      createdAt: row.created_at ?? null,
    });
  }

  const active = [];
  for (const row of raw?.members ?? []) {
    if (row.status !== 'active' || !row.id) {
      continue;
    }
    const email = (row.user_id && emailByUserId.get(row.user_id)) || '';
    if (!email) {
      continue;
    }
    active.push({
      id: row.id,
      name: '',
      email,
      phone: '',
      status: 'active',
      source: 'member',
      userId: row.user_id ?? null,
      createdAt: row.created_at ?? null,
    });
  }

  return [...invited.sort(sortNewestFirst), ...active.sort(sortNewestFirst)];
}
