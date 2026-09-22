import { to24Hour } from '../../availability/utils/availabilityModel';
import {
  bookingDateKey,
  timeStringToMinutesFromMidnight,
} from '../../availability/booking/utils/slotGeneration';
import {
  OWNER_OVERLAP_SAME_TIME,
  OWNER_OVERLAP_SAME_TIME_PICKER,
} from '../constants/ownerBookingOverlapCopy';

/**
 * Same start clock: `YYYY-MM-DD` + wall-clock `H:mm` / `HH:mm` (9:00 and 09:00 match).
 * Not duration overlap.
 *
 * @param {unknown} raw
 * @returns {number | null}
 */
export function startClockMinutes(raw) {
  const value = String(raw ?? '').trim();
  if (!value) {
    return null;
  }
  if (/[ap]m/i.test(value)) {
    return timeStringToMinutesFromMidnight(to24Hour(value));
  }
  const isoTime = value.match(/T(\d{1,2}:\d{2})/);
  if (isoTime) {
    return timeStringToMinutesFromMidnight(isoTime[1]);
  }
  return timeStringToMinutesFromMidnight(value);
}

/**
 * @param {unknown[]} rows
 * @param {string | null | undefined} dateKey
 * @returns {unknown[]}
 */
export function bookingsOnDate(rows, dateKey) {
  const key = String(dateKey ?? '').trim();
  if (!key) {
    return [];
  }
  return (rows ?? []).filter((row) => bookingDateKey(row) === key);
}

/**
 * @param {{
 *   mode?: 'create' | 'reschedule';
 *   dateKey?: string | null;
 *   startTime?: string | null;
 *   rows?: unknown[];
 *   tone?: 'confirm' | 'picker';
 * }} args
 * @returns {string | null}
 */
export function resolveOwnerOverlapHeadsUp({
  dateKey = null,
  startTime = null,
  rows = [],
  tone = 'confirm',
} = {}) {
  const selectedStart = startClockMinutes(startTime);
  if (selectedStart == null) {
    return null;
  }
  const sameStart = bookingsOnDate(rows, dateKey).some((row) => {
    const start = startClockMinutes(row?.start_time ?? row?.startTime);
    return start != null && start === selectedStart;
  });
  if (!sameStart) {
    return null;
  }
  return tone === 'picker' ? OWNER_OVERLAP_SAME_TIME_PICKER : OWNER_OVERLAP_SAME_TIME;
}
