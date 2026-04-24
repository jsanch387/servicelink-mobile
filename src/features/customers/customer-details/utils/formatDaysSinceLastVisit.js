/**
 * Human-readable distance from a calendar day to "now" (e.g. "142 days ago").
 * Uses local calendar dates (midnight boundary), not 24h rolling windows.
 *
 * @param {Date | string | number} visitInput
 * @param {Date | number} [nowInput=Date.now()] for tests
 * @returns {string} empty string if `visitInput` is invalid
 */
export function formatDaysSinceLastVisit(visitInput, nowInput = Date.now()) {
  const visit = visitInput instanceof Date ? visitInput : new Date(visitInput);
  const now = nowInput instanceof Date ? nowInput : new Date(nowInput);
  if (Number.isNaN(visit.getTime()) || Number.isNaN(now.getTime())) {
    return '';
  }

  const utcDay = (d) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((utcDay(now) - utcDay(visit)) / 86400000);

  if (diffDays === 0) {
    return 'Today';
  }
  if (diffDays === 1) {
    return 'Yesterday';
  }
  if (diffDays > 1) {
    return `${diffDays} days ago`;
  }
  if (diffDays === -1) {
    return 'Tomorrow';
  }
  return `in ${Math.abs(diffDays)} days`;
}

/**
 * Shorter copy for inline use next to a label (e.g. "142 days" instead of "142 days ago").
 * @param {Date | string | number} visitInput
 * @param {Date | number} [nowInput=Date.now()]
 */
export function formatDaysSinceLastVisitInline(visitInput, nowInput = Date.now()) {
  const s = formatDaysSinceLastVisit(visitInput, nowInput);
  if (s.endsWith(' days ago')) {
    return s.slice(0, -4);
  }
  return s;
}

/**
 * Compact relative copy for UI chips/labels (e.g. "19d ago").
 * Uses calendar-day distance like `formatDaysSinceLastVisit`.
 *
 * @param {Date | string | number} visitInput
 * @param {Date | number} [nowInput=Date.now()]
 * @returns {string}
 */
export function formatDaysSinceLastVisitCompact(visitInput, nowInput = Date.now()) {
  const visit = visitInput instanceof Date ? visitInput : new Date(visitInput);
  const now = nowInput instanceof Date ? nowInput : new Date(nowInput);
  if (Number.isNaN(visit.getTime()) || Number.isNaN(now.getTime())) {
    return '';
  }

  const utcDay = (d) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((utcDay(now) - utcDay(visit)) / 86400000);

  if (diffDays >= 0) {
    return `${diffDays}d ago`;
  }
  return `in ${Math.abs(diffDays)}d`;
}
