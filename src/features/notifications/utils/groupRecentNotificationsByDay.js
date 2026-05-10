/**
 * Start of the local calendar day for `d` (local midnight).
 * @param {Date} d
 * @returns {number} epoch ms
 */
export function startOfLocalDayMs(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/**
 * @param {string} createdAtIso
 * @param {Date} now
 * @returns {'today' | 'yesterday' | 'older'}
 */
export function bucketNotificationDay(createdAtIso, now) {
  const created = new Date(createdAtIso);
  if (Number.isNaN(created.getTime())) {
    return 'older';
  }
  const todayStart = startOfLocalDayMs(now);
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const yMs = yesterdayStart.getTime();
  const t = created.getTime();
  if (t >= todayStart) {
    return 'today';
  }
  if (t >= yMs) {
    return 'yesterday';
  }
  return 'older';
}

/**
 * Groups recent inbox rows for section headers (local device calendar).
 *
 * @template T
 * @param {T[]} items Newest-first list from the API (order preserved within each bucket).
 * @param {Date} [now] Defaults to `new Date()`; inject in tests.
 * @returns {Array<{ title: string; data: T[] }>}
 */
export function groupRecentNotificationsByDay(items, now = new Date()) {
  /** @type {T[]} */
  const today = [];
  /** @type {T[]} */
  const yesterday = [];
  /** @type {T[]} */
  const older = [];

  for (const item of items) {
    // `createdAt` comes from `mapNotificationRowToInboxItem`; missing → Older.
    const createdAt =
      typeof item === 'object' && item !== null && 'createdAt' in item
        ? String(/** @type {{ createdAt?: string }} */ (item).createdAt ?? '')
        : '';
    const bucket = bucketNotificationDay(createdAt, now);
    if (bucket === 'today') {
      today.push(item);
    } else if (bucket === 'yesterday') {
      yesterday.push(item);
    } else {
      older.push(item);
    }
  }

  /** @type {Array<{ title: string; data: T[] }>} */
  const sections = [];
  if (today.length > 0) {
    sections.push({ title: 'Today', data: today });
  }
  if (yesterday.length > 0) {
    sections.push({ title: 'Yesterday', data: yesterday });
  }
  if (older.length > 0) {
    sections.push({ title: 'Older', data: older });
  }
  return sections;
}
