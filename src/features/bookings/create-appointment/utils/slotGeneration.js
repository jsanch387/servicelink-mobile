import { format24HourTo12Hour } from '../../../availability/utils/availabilityModel';
import { parseLocalYyyyMmDd, toLocalYyyyMmDd } from '../../../../components/ui/calendarDateKey';

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

function timeOffBlocksOverlap(dateKey, slotStartM, durationM, blocks) {
  for (const b of blocks ?? []) {
    const bDate = String(b?.date ?? '').trim();
    if (bDate !== dateKey) continue;
    const bs = timeStringToMinutesFromMidnight(b?.start_time ?? b?.startTime);
    const be = timeStringToMinutesFromMidnight(b?.end_time ?? b?.endTime);
    if (bs == null || be == null || be <= bs) continue;
    const blockLen = be - bs;
    if (intervalsOverlap(slotStartM, durationM, bs, blockLen)) {
      return true;
    }
  }
  return false;
}

function existingOverlap(dateKey, slotStartM, durationM, existingRows) {
  for (const row of existingRows ?? []) {
    const rowDate = String(row?.scheduled_date ?? row?.scheduledDate ?? '').slice(0, 10);
    if (rowDate !== dateKey) continue;
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
 * Generate bookable start labels (`"8:00 AM"`) for a local calendar day.
 *
 * @param {{
 *   dateKey: string;
 *   weeklySchedule: Record<string, { enabled?: boolean; start?: string; end?: string }>;
 *   serviceDurationMinutes: number;
 *   existingBookings: Record<string, unknown>[];
 *   timeOffBlocks: unknown[];
 *   incrementMinutes?: number;
 *   nowMs?: number;
 * }} params
 * @returns {string[]}
 */
export function generateTimeSlots({
  dateKey,
  weeklySchedule,
  serviceDurationMinutes,
  existingBookings,
  timeOffBlocks,
  incrementMinutes = 30,
  nowMs = Date.now(),
}) {
  const window = dayWindowMinutes(dateKey, weeklySchedule);
  if (!window) return [];

  const duration = Math.max(15, Number(serviceDurationMinutes) || 60);
  const { startM, endM } = window;

  const dayDate = parseLocalYyyyMmDd(dateKey);
  if (!dayDate) return [];

  const todayKey = toLocalYyyyMmDd(new Date());
  const isToday = dateKey === todayKey;
  const now = new Date(nowMs);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const out = [];
  for (let t = startM; t + duration <= endM; t += incrementMinutes) {
    if (isToday && t <= nowMinutes) {
      continue;
    }
    if (existingOverlap(dateKey, t, duration, existingBookings)) {
      continue;
    }
    if (timeOffBlocksOverlap(dateKey, t, duration, timeOffBlocks)) {
      continue;
    }
    const hh = String(Math.floor(t / 60)).padStart(2, '0');
    const mm = String(t % 60).padStart(2, '0');
    const label = format24HourTo12Hour(`${hh}:${mm}`);
    out.push(label);
  }
  return out;
}
