/**
 * Combines Postgres `date` + `time` as one instant using the **device local** timezone.
 * Good enough until you add `timestamptz` + business timezone on the server.
 *
 * @param {string} scheduledDate - e.g. "2026-04-04"
 * @param {string} startTime - e.g. "10:00:00"
 * @returns {number} epoch ms, or NaN if invalid
 */
export function parseBookingStartLocalMs(scheduledDate, startTime) {
  if (scheduledDate == null) {
    return NaN;
  }
  const dRaw = String(scheduledDate).trim();
  if (!dRaw) {
    return NaN;
  }
  const datePart = dRaw.includes('T') ? dRaw.split('T')[0] : dRaw.slice(0, 10);
  let rawTime =
    startTime == null || String(startTime).trim() === '' ? '00:00:00' : String(startTime).trim();
  rawTime = rawTime.replace(/\.\d+/, '').replace(/[zZ]$/, '');
  rawTime = rawTime.replace(/[+-]\d{2}:?\d{2}$/, '').trim();
  let timePart = rawTime.length >= 8 && rawTime.includes(':') ? rawTime.slice(0, 8) : rawTime;
  if (/^\d{1,2}:\d{2}$/.test(timePart)) {
    const [h, m] = timePart.split(':');
    timePart = `${h.padStart(2, '0')}:${m}:00`;
  }
  const isoLocal = `${datePart}T${timePart}`;
  const t = new Date(isoLocal);
  const ms = t.getTime();
  return Number.isFinite(ms) ? ms : NaN;
}

export function localYyyyMmDd(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * @param {number} startMs
 * @param {number} nowMs
 */
export function formatStartsRelative(startMs, nowMs) {
  const diff = startMs - nowMs;
  if (!Number.isFinite(diff)) {
    return '';
  }
  const mins = Math.max(0, Math.round(diff / 60000));
  if (mins < 1) {
    return 'Starting soon';
  }
  if (mins < 60) {
    return `Starts in ${mins} min${mins === 1 ? '' : 's'}`;
  }
  const hours = Math.round(mins / 60);
  if (hours < 48) {
    return `Starts in ${hours} hour${hours === 1 ? '' : 's'}`;
  }
  const days = Math.round(hours / 24);
  return `Starts in ${days} day${days === 1 ? '' : 's'}`;
}
