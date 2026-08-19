/**
 * Shared date/time display helpers for memberships UI.
 */

/**
 * @param {string | null | undefined} ymd
 */
export function formatDisplayDate(ymd) {
  const raw = String(ymd ?? '').trim();
  if (!/^\d{4}-\d{2}-\d{2}/.test(raw)) return '—';
  const [y, m, d] = raw
    .slice(0, 10)
    .split('-')
    .map((n) => Number(n));
  const date = new Date(y, m - 1, d);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * @param {string | null | undefined} hhmm
 */
export function formatDisplayTime(hhmm) {
  const raw = String(hhmm ?? '').trim();
  const match = /^(\d{1,2}):(\d{2})/.exec(raw);
  if (!match) return raw || '—';
  let hour = Number(match[1]);
  const minute = match[2];
  const suffix = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  if (hour === 0) hour = 12;
  return `${hour}:${minute} ${suffix}`;
}
