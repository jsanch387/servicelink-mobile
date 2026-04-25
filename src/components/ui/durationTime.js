export const SERVICE_DURATION_MIN_MINUTES = 30;
export const SERVICE_DURATION_MAX_MINUTES = 10 * 60 + 30;

export function serviceDurationHHmmToMinutes(hhmm) {
  const [h = '0', m = '00'] = String(hhmm ?? '').split(':');
  const hours = Math.min(10, Math.max(0, parseInt(h, 10) || 0));
  const minute = m === '30' ? 30 : 0;
  return hours * 60 + minute;
}

export function minutesToServiceDurationHHmm(total) {
  if (total == null || total <= 0) return '';
  const rounded = Math.round(total / 30) * 30;
  const clamped = Math.min(
    SERVICE_DURATION_MAX_MINUTES,
    Math.max(SERVICE_DURATION_MIN_MINUTES, rounded),
  );
  const h = Math.floor(clamped / 60);
  const rem = clamped % 60;
  return `${h.toString().padStart(2, '0')}:${rem === 30 ? '30' : '00'}`;
}

export function normalizeServiceDurationHHmm(input) {
  if (!String(input ?? '').trim()) return '';
  let mins = serviceDurationHHmmToMinutes(input);
  if (mins <= 0) mins = SERVICE_DURATION_MIN_MINUTES;
  mins = Math.min(
    SERVICE_DURATION_MAX_MINUTES,
    Math.max(SERVICE_DURATION_MIN_MINUTES, Math.round(mins / 30) * 30),
  );
  return minutesToServiceDurationHHmm(mins);
}

export function isValidServiceDurationHHmm(hhmm) {
  const trimmed = String(hhmm ?? '').trim();
  if (!/^\d{1,2}:\d{2}$/.test(trimmed)) return false;
  const [hRaw, minRaw] = trimmed.split(':');
  const h = parseInt(hRaw ?? '', 10);
  if (!Number.isFinite(h) || h < 0 || h > 10) return false;
  const mm = (minRaw ?? '').padStart(2, '0');
  if (mm !== '00' && mm !== '30') return false;
  const total = h * 60 + (mm === '30' ? 30 : 0);
  return total >= SERVICE_DURATION_MIN_MINUTES && total <= SERVICE_DURATION_MAX_MINUTES;
}

export function formatServiceDurationSelectLabel(hhmm) {
  const [hs, ms] = String(hhmm ?? '').split(':');
  const h = Math.min(10, Math.max(0, parseInt(hs, 10) || 0));
  const minuteHalf = ms === '30';
  if (h === 0 && minuteHalf) return '30 min';
  if (!minuteHalf) return h === 1 ? '1 hr' : `${h} hrs`;
  return h === 1 ? '1 hr 30 min' : `${h} hrs 30 min`;
}

/**
 * Add-on extra time for display (no "+"). Empty when there are no extra minutes.
 * @param {unknown} rawMinutes
 */
export function formatAddonDurationMinutes(rawMinutes) {
  const minutes = Math.round(Number(rawMinutes));
  if (!Number.isFinite(minutes) || minutes <= 0) return '';

  const h = Math.floor(minutes / 60);
  const m = minutes % 60;

  if (h === 0) {
    return m === 1 ? '1 min' : `${m} min`;
  }
  if (m === 0) {
    return h === 1 ? '1 hr' : `${h} hrs`;
  }
  const hourPart = h === 1 ? '1 hr' : `${h} hrs`;
  const minPart = m === 1 ? '1 min' : `${m} min`;
  return `${hourPart} ${minPart}`;
}

/** Add-on label from stored `HH:mm` (half-hour grid). */
export function formatAddonDurationFromHHmm(hhmm) {
  return formatAddonDurationMinutes(serviceDurationHHmmToMinutes(hhmm));
}

/**
 * Add-on picker: allow "no extra time" (`00:00`) or 30+ minute steps (same grid as services).
 * @param {string} input
 * @returns {string} `HH:mm` or `''` when empty input
 */
export function normalizeAddonDurationHHmmForPicker(input) {
  const trimmed = String(input ?? '').trim();
  if (!trimmed) return '';
  let mins = serviceDurationHHmmToMinutes(trimmed);
  if (mins <= 0) return '00:00';
  mins = Math.min(
    SERVICE_DURATION_MAX_MINUTES,
    Math.max(SERVICE_DURATION_MIN_MINUTES, Math.round(mins / 30) * 30),
  );
  return minutesToServiceDurationHHmm(mins);
}
