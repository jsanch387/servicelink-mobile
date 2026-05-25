import { formatAddonDurationMinutes } from '../../../components/ui/durationTime';
import { formatHumanReadableCalendarDate } from '../../customers/maintenance-invite/utils/formatPreferredDateDisplay';

const NOT_SET_LABEL = 'Not set yet';

/**
 * @param {string | null | undefined} anchorDate
 * @returns {boolean}
 */
export function maintenanceAnchorDateIsPlaceholder(anchorDate) {
  const date = String(anchorDate ?? '').trim();
  return !date || date.startsWith('0001') || date.startsWith('1970');
}

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
 * @param {string | null | undefined} anchorTime
 * @returns {string}
 */
export function formatMaintenanceAnchorTime12h(anchorTime) {
  const timeRaw = String(anchorTime ?? '').trim();
  const timeMatch = /^(\d{1,2}):(\d{2})/.exec(timeRaw);
  if (!timeMatch) {
    return '';
  }
  const h = Number(timeMatch[1]) % 24;
  const min = timeMatch[2];
  const period = h >= 12 ? 'PM' : 'AM';
  let h12 = h % 12;
  if (h12 === 0) {
    h12 = 12;
  }
  return `${h12}:${min} ${period}`;
}

/**
 * @param {string | null | undefined} anchorDate
 * @returns {string}
 */
export function formatMaintenanceAnchorDate(anchorDate) {
  if (maintenanceAnchorDateIsPlaceholder(anchorDate)) {
    return NOT_SET_LABEL;
  }
  const formatted = formatHumanReadableCalendarDate(anchorDate);
  return formatted || NOT_SET_LABEL;
}

/**
 * @param {string | null | undefined} anchorDate
 * @param {string | null | undefined} anchorTime
 * @returns {string}
 */
export function formatMaintenanceAnchorTime(anchorDate, anchorTime) {
  if (maintenanceAnchorDateIsPlaceholder(anchorDate)) {
    return NOT_SET_LABEL;
  }
  const formatted = formatMaintenanceAnchorTime12h(anchorTime);
  return formatted || NOT_SET_LABEL;
}

/**
 * @param {string | null | undefined} anchorDate
 * @param {string | null | undefined} anchorTime
 * @returns {string}
 */
export function formatMaintenanceAnchor(anchorDate, anchorTime) {
  const dateLabel = formatMaintenanceAnchorDate(anchorDate);
  if (dateLabel === NOT_SET_LABEL) {
    return NOT_SET_LABEL;
  }
  const timeLabel = formatMaintenanceAnchorTime(anchorDate, anchorTime);
  if (timeLabel === NOT_SET_LABEL) {
    return dateLabel;
  }
  return `${dateLabel} · ${timeLabel}`;
}
