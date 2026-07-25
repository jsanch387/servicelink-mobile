import { calendarYyyyMmDdFromScheduledDate } from '../../../home/utils/bookingStart';
import { format24HourTo12Hour, minimumNoticeToMinutes } from '../../utils/availabilityModel';
import { parseLocalYyyyMmDd } from '../../../../components/ui/calendarDateKey';
import { BOOKING_SLOT_INCREMENT_MINUTES } from '../constants';

const WEEK_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function dayKeyForDate(d) {
  return WEEK_KEYS[d.getDay()];
}

/** @returns {number | null} minutes from midnight for "9:00", "09:30:00", etc. */
export function timeStringToMinutesFromMidnight(t) {
  const raw = String(t ?? '').trim();
  if (!raw) return null;
  const cleaned = raw.replace(/\.\d+/, '').replace(/[zZ]$/, '');
  const m = cleaned.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (!Number.isFinite(h) || !Number.isFinite(min)) return null;
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

function intervalsOverlap(aStart, aLen, bStart, bLen) {
  const aEnd = aStart + aLen;
  const bEnd = bStart + bLen;
  return aStart < bEnd && aEnd > bStart;
}

/** Calendar day for a blocking booking row (Supabase or public blocked API). */
export function bookingDateKey(row) {
  return (
    calendarYyyyMmDdFromScheduledDate(row?.scheduled_date ?? row?.scheduledDate) ||
    calendarYyyyMmDdFromScheduledDate(row?.date) ||
    ''
  );
}

function normalizeBookingStartMinutes(row) {
  const t = row?.start_time ?? row?.startTime;
  return timeStringToMinutesFromMidnight(t);
}

function bookingDurationMinutes(row) {
  const d = Number(row?.duration_minutes ?? row?.durationMinutes ?? 60);
  return Number.isFinite(d) && d > 0 ? d : 60;
}

/**
 * @param {string} dateKey YYYY-MM-DD
 * @param {Record<string, { enabled?: boolean; start?: string; end?: string }>} weeklySchedule
 */
function dayWindowMinutes(dateKey, weeklySchedule) {
  const d = parseLocalYyyyMmDd(dateKey);
  if (!d) return null;
  const key = dayKeyForDate(d);
  const day = weeklySchedule?.[key];
  if (!day || !day.enabled) return null;
  const startM = timeStringToMinutesFromMidnight(day.start);
  const endM = timeStringToMinutesFromMidnight(day.end);
  if (startM == null || endM == null || endM <= startM) return null;
  return { startM, endM };
}

function timeOffBlockCoversDate(block, dateKey) {
  const legacyDate = String(block?.date ?? '').trim();
  const startDate = String(block?.start_date ?? block?.startDate ?? legacyDate).trim();
  const endDate = String(block?.end_date ?? block?.endDate ?? startDate).trim();
  if (!startDate || !endDate) return false;
  return dateKey >= startDate && dateKey <= endDate;
}

function timeOffBlocksOverlap(dateKey, slotStartM, durationM, blocks) {
  for (const b of blocks ?? []) {
    if (!timeOffBlockCoversDate(b, dateKey)) continue;
    if (Boolean(b?.all_day ?? b?.allDay)) {
      return true;
    }
    const bs = timeStringToMinutesFromMidnight(b?.start_time ?? b?.startTime);
    const be = timeStringToMinutesFromMidnight(b?.end_time ?? b?.endTime);
    if (bs == null || be == null || be <= bs) continue;
    if (intervalsOverlap(slotStartM, durationM, bs, be - bs)) {
      return true;
    }
  }
  return false;
}

function existingOverlap(dateKey, slotStartM, durationM, existingRows) {
  for (const row of existingRows ?? []) {
    if (bookingDateKey(row) !== dateKey) continue;
    const bStart = normalizeBookingStartMinutes(row);
    if (bStart == null) continue;
    const bLen = bookingDurationMinutes(row);
    if (intervalsOverlap(slotStartM, durationM, bStart, bLen)) {
      return true;
    }
  }
  return false;
}

/**
 * Bookable start labels (`"8:00 AM"`) for a local calendar day.
 *
 * @param {{
 *   dateKey: string;
 *   weeklySchedule: Record<string, { enabled?: boolean; start?: string; end?: string }>;
 *   serviceDurationMinutes: number;
 *   existingBookings: Record<string, unknown>[];
 *   timeOffBlocks: unknown[];
 *   minimumNotice?: string;
 *   ownerManualBooking?: boolean;
 *   incrementMinutes?: number;
 *   nowMs?: number;
 * }} params
 * `ownerManualBooking` — owner create/edit: skip lead time + time off (still respects weekly hours, past times, overlaps).
 * @returns {string[]}
 */
export function generateTimeSlots({
  dateKey,
  weeklySchedule,
  serviceDurationMinutes,
  existingBookings,
  timeOffBlocks,
  minimumNotice = 'none',
  ownerManualBooking = false,
  incrementMinutes = BOOKING_SLOT_INCREMENT_MINUTES,
  nowMs = Date.now(),
}) {
  const window = dayWindowMinutes(dateKey, weeklySchedule);
  if (!window) return [];

  const duration = Math.max(15, Number(serviceDurationMinutes) || 60);
  const { startM, endM } = window;

  const dayDate = parseLocalYyyyMmDd(dateKey);
  if (!dayDate) return [];

  // Owners can squeeze last-minute jobs; customers still need lead time.
  const leadMinutes = ownerManualBooking ? 0 : minimumNoticeToMinutes(minimumNotice);
  const earliestStartMs = nowMs + leadMinutes * 60 * 1000;

  const out = [];
  for (let t = startM; t + duration <= endM; t += incrementMinutes) {
    const slotStart = new Date(dayDate);
    slotStart.setHours(Math.floor(t / 60), t % 60, 0, 0);
    if (slotStart.getTime() < earliestStartMs) continue;
    if (existingOverlap(dateKey, t, duration, existingBookings)) continue;
    if (!ownerManualBooking && timeOffBlocksOverlap(dateKey, t, duration, timeOffBlocks)) {
      continue;
    }
    const hh = String(Math.floor(t / 60)).padStart(2, '0');
    const mm = String(t % 60).padStart(2, '0');
    out.push(format24HourTo12Hour(`${hh}:${mm}`));
  }
  return out;
}
