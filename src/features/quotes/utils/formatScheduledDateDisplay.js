/**
 * @param {string | null | undefined} yyyyMmDd
 * @returns {boolean}
 */
export function isValidCalendarYyyyMmDd(yyyyMmDd) {
  const s = String(yyyyMmDd ?? '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, mo, d] = s.split('-').map((x) => Number(x));
  const dt = new Date(y, mo - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d;
}

/**
 * Human-readable local date for UI (e.g. "Friday, May 8, 2026").
 *
 * @param {string | null | undefined} yyyyMmDd
 * @returns {string} empty when invalid / empty
 */
export function formatScheduledDateUserFacing(yyyyMmDd) {
  const s = String(yyyyMmDd ?? '').trim();
  if (!isValidCalendarYyyyMmDd(s)) return '';
  const [y, mo, d] = s.split('-').map((x) => Number(x));
  const dt = new Date(y, mo - 1, d);
  return dt.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Owner-facing preferred date/time from a `quotes` row (`scheduled_date` + `scheduled_start_time`).
 *
 * @param {{ scheduled_date?: string | null; scheduled_start_time?: string | null }} row
 * @returns {string} empty when neither field is usable
 */
export function formatQuoteRowScheduleLabel(row) {
  const dateStr = String(row?.scheduled_date ?? '').trim();
  const timeRaw = String(row?.scheduled_start_time ?? '').trim();

  const datePart = isValidCalendarYyyyMmDd(dateStr) ? formatScheduledDateUserFacing(dateStr) : '';

  let timePart = '';
  if (timeRaw) {
    const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(timeRaw);
    if (m) {
      const hh = Number(m[1]);
      const mm = Number(m[2]);
      if (Number.isFinite(hh) && Number.isFinite(mm)) {
        const t = new Date(2000, 0, 1, hh, mm);
        timePart = t.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
      }
    }
    if (!timePart) {
      const asDate = new Date(timeRaw);
      if (Number.isFinite(asDate.getTime()) && !Number.isNaN(asDate.getTime())) {
        timePart = asDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
      } else {
        timePart = timeRaw;
      }
    }
  }

  if (datePart && timePart) return `${datePart} · ${timePart}`;
  return datePart || timePart || '';
}
