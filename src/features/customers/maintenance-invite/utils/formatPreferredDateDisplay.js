import { isValidCalendarYyyyMmDd } from '../../../quotes/utils/formatScheduledDateDisplay';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/**
 * Postgres / API dates may arrive as `2026-06-15` or `2026-06-15T00:00:00.000Z`.
 *
 * @param {string | null | undefined} raw
 * @returns {string}
 */
export function normalizeCalendarYyyyMmDd(raw) {
  const s = String(raw ?? '').trim();
  if (!s) {
    return '';
  }
  const prefix = s.slice(0, 10);
  return isValidCalendarYyyyMmDd(prefix) ? prefix : '';
}

/**
 * e.g. `2026-06-15` → `June 15, 2026`
 *
 * @param {string | null | undefined} yyyyMmDd
 * @returns {string}
 */
export function formatHumanReadableCalendarDate(yyyyMmDd) {
  const normalized = normalizeCalendarYyyyMmDd(yyyyMmDd);
  if (!normalized) {
    return '';
  }
  const [yearStr, monthStr, dayStr] = normalized.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  const monthName = MONTH_NAMES[month - 1] ?? '';
  if (!monthName) {
    return '';
  }
  return `${monthName} ${day}, ${year}`;
}

/**
 * @param {string | null | undefined} yyyyMmDd
 * @returns {string}
 */
export function formatPreferredDateMmDdYyyy(yyyyMmDd) {
  const s = String(yyyyMmDd ?? '').trim();
  if (!isValidCalendarYyyyMmDd(s)) {
    return '';
  }
  const [y, mo, d] = s.split('-');
  return `${mo}/${d}/${y}`;
}
