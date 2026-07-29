/**
 * Parse a 12h wall time like "2:00 PM" into minutes since midnight.
 * @param {string | null | undefined} time12h
 * @returns {number | null}
 */
export function parseTime12hToMinutes(time12h) {
  const raw = String(time12h ?? '').trim();
  const m = raw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2]);
  if (!Number.isFinite(h) || !Number.isFinite(min) || min < 0 || min > 59) return null;
  const ap = m[3].toUpperCase();
  if (ap === 'AM' && h === 12) h = 0;
  if (ap === 'PM' && h !== 12) h += 12;
  if (h < 0 || h > 23) return null;
  return h * 60 + min;
}

/**
 * @param {number} totalMinutes
 * @returns {string} e.g. "2:00 PM"
 */
export function formatMinutesToTime12h(totalMinutes) {
  const normalized = ((Math.round(totalMinutes) % (24 * 60)) + 24 * 60) % (24 * 60);
  let h = Math.floor(normalized / 60);
  const min = normalized % 60;
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${String(min).padStart(2, '0')} ${ap}`;
}

/**
 * Advance a 12h start time by duration minutes (for sequential multi-job bookings).
 * @param {string | null | undefined} time12h
 * @param {number} addMinutes
 * @returns {string | null}
 */
export function addMinutesToTime12h(time12h, addMinutes) {
  const start = parseTime12hToMinutes(time12h);
  if (start == null) return null;
  const delta = Math.max(0, Math.round(Number(addMinutes) || 0));
  return formatMinutesToTime12h(start + delta);
}
