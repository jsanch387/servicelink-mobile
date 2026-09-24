import { presentPersonDisplay } from '../../../../utils/presentPersonDisplay';

/**
 * @typedef {{ userId: string; label: string; kind: 'owner' | 'member' | 'former' }} BookingAssignee
 */

/**
 * API labels sometimes look like `name@shop.com (owner)`. Keep the email only.
 *
 * @param {unknown} value
 * @returns {string}
 */
export function stripAssigneeRoleSuffix(value) {
  return String(value ?? '')
    .replace(/\s*\((?:owner|member|former|team member)\)\s*$/i, '')
    .trim();
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function readAssigneeEmail(value) {
  const cleaned = stripAssigneeRoleSuffix(value);
  return cleaned.includes('@') ? cleaned : '';
}

/**
 * @param {unknown} raw
 * @returns {BookingAssignee | null}
 */
export function mapAssigneeRow(raw) {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const userId = String(raw.userId ?? raw.user_id ?? '').trim();
  if (!userId) {
    return null;
  }
  const kind =
    raw.kind === 'owner' || raw.kind === 'former' || raw.kind === 'member' ? raw.kind : 'member';
  const named = stripAssigneeRoleSuffix(raw.name ?? raw.fullName ?? raw.full_name ?? '');
  const rawLabel = stripAssigneeRoleSuffix(raw.label ?? '');
  const email = readAssigneeEmail(raw.email) || readAssigneeEmail(raw.label);
  const label =
    (named && !named.includes('@') ? named : '') ||
    (rawLabel && !rawLabel.includes('@') ? rawLabel : '') ||
    (kind === 'owner' ? 'Owner' : email ? 'Member' : '');
  if (!label) {
    return null;
  }
  return email ? { userId, label, kind, email } : { userId, label, kind };
}

/**
 * @param {unknown} payload
 * @returns {BookingAssignee[]}
 */
export function mapBookingAssignees(payload) {
  const rows = Array.isArray(payload)
    ? payload
    : payload && typeof payload === 'object' && Array.isArray(payload.assignees)
      ? payload.assignees
      : [];
  return rows.map(mapAssigneeRow).filter(Boolean);
}

/**
 * Team = more than one assignable person. A solo owner (or owner tagged as
 * `member`) is not a team — hide Unassigned on those shops.
 *
 * @param {BookingAssignee[]} assignees
 */
export function canShowAssigneeControl(assignees) {
  const people = (assignees ?? []).filter((row) => row.kind === 'owner' || row.kind === 'member');
  return people.length > 1;
}

/**
 * @param {string | null | undefined} assignedUserId
 * @param {BookingAssignee[]} assignees
 * @returns {string | null}
 */
export function resolveAssigneeLabel(assignedUserId, assignees) {
  const id = typeof assignedUserId === 'string' ? assignedUserId.trim() : '';
  if (!id) {
    return null;
  }
  const match = (assignees ?? []).find((row) => row.userId === id);
  if (!match) {
    return null;
  }
  return assigneeUiLabel(match);
}

/**
 * API lists may omit removed teammates. Keep those former rows so past jobs
 * still show who was assigned.
 *
 * @param {BookingAssignee[]} primary
 * @param {BookingAssignee[]} extra
 * @returns {BookingAssignee[]}
 */
export function mergeAssigneesKeepingFormer(primary, extra) {
  const byId = new Map();
  for (const row of primary ?? []) {
    if (row?.userId) {
      byId.set(row.userId, row);
    }
  }
  for (const row of extra ?? []) {
    if (!row?.userId || byId.has(row.userId) || row.kind !== 'former') {
      continue;
    }
    byId.set(row.userId, row);
  }
  return [...byId.values()];
}

/**
 * @param {BookingAssignee[]} assignees
 * @returns {Array<{ userId: string | null; label: string; kind: string }>}
 */
export function buildAssignablePickerOptions(assignees) {
  const people = (assignees ?? []).filter((row) => row.kind === 'owner' || row.kind === 'member');
  return [{ userId: null, label: 'Unassigned', kind: 'unassigned' }, ...people];
}

/**
 * Shop label for this person — same name whether you are looking at yourself or a teammate.
 *
 * @param {BookingAssignee | null | undefined} row
 * @returns {string | null}
 */
export function assigneeUiLabel(row) {
  if (!row) {
    return null;
  }
  const raw = String(row.label ?? '').trim();
  if (!raw) {
    return row.kind === 'owner' ? 'Owner' : null;
  }
  return presentAssigneeDisplay(raw, row.email).title;
}

/**
 * Shop-set name is the title. Email stays smaller underneath. Never invent a
 * name from the email local-part.
 *
 * @param {unknown} rawLabel
 * @param {unknown} [email]
 * @returns {{ title: string; subtitle: string; initial: string }}
 */
export function presentAssigneeDisplay(rawLabel, email = '') {
  const value = stripAssigneeRoleSuffix(rawLabel);
  const mail = readAssigneeEmail(email) || readAssigneeEmail(rawLabel);
  if (value && !value.includes('@')) {
    return presentPersonDisplay(value, mail);
  }
  return {
    title: 'Team member',
    subtitle: mail || (value.includes('@') ? value : ''),
    initial: 'T',
  };
}
