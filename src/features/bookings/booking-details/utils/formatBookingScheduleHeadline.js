/**
 * Short visit headline for booking details: "Wed, Sep 23" and "9:00 – 10:00 AM".
 * Clock text is built from local hours so the range does not depend on locale AM/PM placement.
 *
 * @param {number} ms
 * @param {number} [nowMs]
 * @returns {string}
 */
export function formatHeadlineDate(ms, nowMs = Date.now()) {
  if (!Number.isFinite(ms)) {
    return 'Date not set';
  }
  const start = new Date(ms);
  const includeYear = start.getFullYear() !== new Date(nowMs).getFullYear();
  return start.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    ...(includeYear ? { year: 'numeric' } : {}),
  });
}

/**
 * @param {Date} date
 * @param {boolean} withPeriod
 */
function formatClock(date, withPeriod) {
  const hours24 = date.getHours();
  const minutes = date.getMinutes();
  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hours = hours24 % 12 || 12;
  const clock = `${hours}:${String(minutes).padStart(2, '0')}`;
  return withPeriod ? `${clock} ${period}` : clock;
}

/**
 * @param {number} ms
 * @param {number | string | null | undefined} durationMinutes
 * @returns {string}
 */
export function formatTimeRange(ms, durationMinutes) {
  if (!Number.isFinite(ms)) {
    return '';
  }
  const start = new Date(ms);
  const minutes = Number(durationMinutes);
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return formatClock(start, true);
  }
  const end = new Date(ms + minutes * 60 * 1000);
  const samePeriod = start.getHours() >= 12 === end.getHours() >= 12;
  return `${formatClock(start, !samePeriod)} – ${formatClock(end, true)}`;
}
