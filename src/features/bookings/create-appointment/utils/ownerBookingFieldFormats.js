import { normalizePhoneForDatabase } from '../../../../utils/phone';

/**
 * @param {string | null | undefined} phoneUi
 * @returns {string} digits suitable for API + DB
 */
export function bookingCustomerPhoneDigits(phoneUi) {
  return normalizePhoneForDatabase(phoneUi) ?? '';
}

/**
 * @param {string} time12h e.g. "8:00 AM"
 * @returns {string} "HH:mm:ss" for Postgres `time` columns
 */
export function startTimeToSqlTime(time12h) {
  const raw = String(time12h ?? '').trim();
  if (!raw) return '09:00:00';
  const m = raw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return '09:00:00';
  let h = Number(m[1]);
  const min = m[2];
  const ap = m[3].toUpperCase();
  if (ap === 'AM' && h === 12) h = 0;
  if (ap === 'PM' && h !== 12) h += 12;
  return `${String(h).padStart(2, '0')}:${min}:00`;
}

/**
 * 24-hour `HH:mm` for `POST /api/public/bookings` (`startTime` field).
 * @param {string | null | undefined} time12h e.g. "2:00 PM"
 * @returns {string}
 */
export function startTime12hToApiStartTime(time12h) {
  const sql = startTimeToSqlTime(time12h);
  return sql.length >= 8 ? sql.slice(0, 5) : '09:00';
}
