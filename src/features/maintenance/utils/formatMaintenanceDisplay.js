import { formatAddonDurationMinutes } from '../../../components/ui/durationTime';

/**
 * @param {number | null | undefined} cents
 * @returns {string}
 */
export function formatMaintenancePrice(cents) {
  const value = Number(cents ?? 0);
  if (!Number.isFinite(value) || value <= 0) {
    return '—';
  }
  return `$${Math.round(value / 100).toLocaleString()}`;
}

/**
 * @param {number | null | undefined} minutes
 * @returns {string}
 */
export function formatMaintenanceDuration(minutes) {
  const value = Number(minutes ?? 0);
  if (!Number.isFinite(value) || value <= 0) {
    return '—';
  }
  return formatAddonDurationMinutes(value);
}

/**
 * @param {string | null | undefined} anchorDate
 * @param {string | null | undefined} anchorTime
 * @returns {string}
 */
export function formatMaintenanceAnchor(anchorDate, anchorTime) {
  const date = String(anchorDate ?? '').trim();
  if (!date || date.startsWith('0001') || date.startsWith('1970')) {
    return 'Not set yet';
  }
  const timeRaw = String(anchorTime ?? '').trim();
  const timeMatch = /^(\d{1,2}):(\d{2})/.exec(timeRaw);
  if (!timeMatch) {
    return date;
  }
  let h = Number(timeMatch[1]) % 24;
  const min = timeMatch[2];
  const period = h >= 12 ? 'PM' : 'AM';
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return `${date} · ${h12}:${min} ${period}`;
}
