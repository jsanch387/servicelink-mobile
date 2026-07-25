export const PRESET_OPTIONS = [
  { value: 'mon_fri_9_5', label: 'Mon–Fri 9–5' },
  { value: 'mon_sat_8_6', label: 'Mon–Sat 8–6' },
  { value: 'weekends_only', label: 'Weekends' },
  { value: 'custom', label: 'Custom' },
];

/** Allowed `business_availability.minimum_notice` values (DB check constraint). */
export const MINIMUM_NOTICE_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: '30m', label: '30 minutes' },
  { value: '1h', label: '1 hour' },
  { value: '2h', label: '2 hours' },
  { value: '3h', label: '3 hours' },
  { value: '4h', label: '4 hours' },
  { value: '8h', label: '8 hours' },
  { value: '12h', label: '12 hours' },
  { value: '24h', label: '1 day' },
  { value: '48h', label: '2 days' },
  { value: '72h', label: '3 days' },
  { value: '1w', label: '1 week' },
];

const MINIMUM_NOTICE_VALUES = new Set(MINIMUM_NOTICE_OPTIONS.map((o) => o.value));

/**
 * @param {unknown} raw
 * @returns {string} canonical minimum_notice value
 */
export function normalizeMinimumNotice(raw) {
  const value = String(raw ?? '').trim();
  if (MINIMUM_NOTICE_VALUES.has(value)) return value;
  return 'none';
}

/**
 * Lead time in minutes for slot filtering. `none` → 0.
 * @param {unknown} raw
 * @returns {number}
 */
export function minimumNoticeToMinutes(raw) {
  switch (normalizeMinimumNotice(raw)) {
    case '30m':
      return 30;
    case '1h':
      return 60;
    case '2h':
      return 120;
    case '3h':
      return 180;
    case '4h':
      return 240;
    case '8h':
      return 480;
    case '12h':
      return 720;
    case '24h':
      return 1440;
    case '48h':
      return 2880;
    case '72h':
      return 4320;
    case '1w':
      return 10080;
    case 'none':
    default:
      return 0;
  }
}

export const DAY_DEFINITIONS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

/** True if at least one weekday row is toggled on in the availability UI. */
export function dayEnabledMapHasAtLeastOneEnabled(dayEnabledMap) {
  return DAY_DEFINITIONS.some((d) => Boolean(dayEnabledMap?.[d.label]));
}

const DEFAULT_WEEKLY_SCHEDULE = {
  monday: { start: '09:00', end: '17:00', enabled: true },
  tuesday: { start: '09:00', end: '17:00', enabled: true },
  wednesday: { start: '09:00', end: '17:00', enabled: true },
  thursday: { start: '09:00', end: '17:00', enabled: true },
  friday: { start: '09:00', end: '17:00', enabled: true },
  saturday: { start: '09:00', end: '17:00', enabled: false },
  sunday: { start: '09:00', end: '17:00', enabled: false },
};

function to12Hour(hhmm) {
  const raw = String(hhmm ?? '').trim();
  const match = raw.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return '9:00 AM';
  let hour = Number(match[1]);
  const minute = match[2];
  const period = hour >= 12 ? 'PM' : 'AM';
  if (hour === 0) hour = 12;
  if (hour > 12) hour -= 12;
  return `${hour}:${minute} ${period}`;
}

export function format24HourTo12Hour(hhmm) {
  return to12Hour(hhmm);
}

export function to24Hour(time12h) {
  const raw = String(time12h ?? '').trim();
  const match = raw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return '09:00';
  let hour = Number(match[1]);
  const minute = match[2];
  const period = match[3].toUpperCase();
  if (period === 'AM' && hour === 12) hour = 0;
  if (period === 'PM' && hour !== 12) hour += 12;
  return `${String(hour).padStart(2, '0')}:${minute}`;
}

function normalizeHourMinute(raw) {
  const match = String(raw ?? '')
    .trim()
    .match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  if (h < 0 || h > 23) return null;
  const minute = m >= 30 ? 30 : 0;
  return `${String(h).padStart(2, '0')}:${minute === 30 ? '30' : '00'}`;
}

function timeToMinutes(hhmm) {
  const parsed = normalizeHourMinute(hhmm);
  if (!parsed) return null;
  const [h, m] = parsed.split(':');
  return Number(h) * 60 + Number(m);
}

const z = (start, end) => ({
  start: format24HourTo12Hour(start),
  end: format24HourTo12Hour(end),
});

/**
 * Build day toggles + 12h time ranges for a working-hours preset (onboarding + availability UI).
 * @param {'mon_fri_9_5' | 'mon_sat_8_6' | 'weekends_only' | 'custom'} presetValue
 */
export function buildAvailabilityUiFromPreset(presetValue) {
  if (presetValue === 'mon_sat_8_6') {
    const dayEnabledMap = Object.fromEntries(
      DAY_DEFINITIONS.map((d) => [d.label, d.key !== 'sunday']),
    );
    const dayTimeRanges = Object.fromEntries(
      DAY_DEFINITIONS.map((d) => {
        if (d.key === 'sunday') {
          return [d.label, z('09:00', '17:00')];
        }
        return [d.label, z('08:00', '18:00')];
      }),
    );
    return { selectedPreset: 'mon_sat_8_6', dayEnabledMap, dayTimeRanges };
  }
  if (presetValue === 'weekends_only') {
    const dayEnabledMap = Object.fromEntries(
      DAY_DEFINITIONS.map((d) => [d.label, d.key === 'saturday' || d.key === 'sunday']),
    );
    const dayTimeRanges = Object.fromEntries(
      DAY_DEFINITIONS.map((d) => [d.label, z('09:00', '17:00')]),
    );
    return { selectedPreset: 'weekends_only', dayEnabledMap, dayTimeRanges };
  }
  const base = buildDefaultAvailabilityUiModel();
  return {
    selectedPreset: 'mon_fri_9_5',
    dayEnabledMap: base.dayEnabledMap,
    dayTimeRanges: base.dayTimeRanges,
  };
}

export function buildDefaultAvailabilityUiModel() {
  return {
    acceptBookings: false,
    selectedPreset: 'mon_fri_9_5',
    dayEnabledMap: Object.fromEntries(
      DAY_DEFINITIONS.map((d) => [d.label, DEFAULT_WEEKLY_SCHEDULE[d.key].enabled]),
    ),
    dayTimeRanges: Object.fromEntries(
      DAY_DEFINITIONS.map((d) => [
        d.label,
        {
          start: to12Hour(DEFAULT_WEEKLY_SCHEDULE[d.key].start),
          end: to12Hour(DEFAULT_WEEKLY_SCHEDULE[d.key].end),
        },
      ]),
    ),
    timeOffBlocks: [],
    minimumNotice: 'none',
  };
}

export function buildAvailabilityUiModel(row) {
  const fallback = buildDefaultAvailabilityUiModel();
  if (!row) return fallback;
  const weekly =
    row.weekly_schedule && typeof row.weekly_schedule === 'object'
      ? row.weekly_schedule
      : DEFAULT_WEEKLY_SCHEDULE;

  return {
    acceptBookings: Boolean(row.accept_bookings),
    selectedPreset: row.selected_preset || fallback.selectedPreset,
    dayEnabledMap: Object.fromEntries(
      DAY_DEFINITIONS.map((d) => [d.label, Boolean(weekly?.[d.key]?.enabled)]),
    ),
    dayTimeRanges: Object.fromEntries(
      DAY_DEFINITIONS.map((d) => [
        d.label,
        {
          start: to12Hour(weekly?.[d.key]?.start),
          end: to12Hour(weekly?.[d.key]?.end),
        },
      ]),
    ),
    timeOffBlocks: Array.isArray(row.time_off_blocks) ? row.time_off_blocks : [],
    minimumNotice: normalizeMinimumNotice(row.minimum_notice),
  };
}

export function buildWeeklySchedulePayloadFromUi(dayEnabledMap, dayTimeRanges) {
  return Object.fromEntries(
    DAY_DEFINITIONS.map((d) => [
      d.key,
      {
        enabled: Boolean(dayEnabledMap?.[d.label]),
        start: to24Hour(dayTimeRanges?.[d.label]?.start),
        end: to24Hour(dayTimeRanges?.[d.label]?.end),
      },
    ]),
  );
}

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;
export const TIME_OFF_ALL_DAY_START = '00:00';
export const TIME_OFF_ALL_DAY_END = '23:59';

function isValidDateKey(raw) {
  return DATE_KEY_RE.test(String(raw ?? '').trim());
}

/**
 * Resolve inclusive start/end date keys from legacy `{ date }` or range fields.
 * @param {{ date?: string; start_date?: string; end_date?: string; startDate?: string; endDate?: string }} block
 * @returns {{ startDate: string; endDate: string } | null}
 */
export function resolveTimeOffDateRange(block) {
  const legacyDate = String(block?.date ?? '').trim();
  const startDate = String(block?.start_date ?? block?.startDate ?? legacyDate).trim();
  const endDate = String(block?.end_date ?? block?.endDate ?? startDate).trim();
  if (!isValidDateKey(startDate) || !isValidDateKey(endDate)) return null;
  if (endDate < startDate) return null;
  return { startDate, endDate };
}

/**
 * Airbnb-style date range tap: one day or a range; tap again to clear / restart.
 * @param {string | null} rangeStartKey
 * @param {string | null} rangeEndKey
 * @param {string} tappedKey
 * @returns {{ startKey: string | null; endKey: string | null }}
 */
export function advanceTimeOffDateSelection(rangeStartKey, rangeEndKey, tappedKey) {
  const tapped = String(tappedKey ?? '').trim();
  if (!isValidDateKey(tapped)) {
    return { startKey: rangeStartKey, endKey: rangeEndKey };
  }

  if (!rangeStartKey) {
    return { startKey: tapped, endKey: null };
  }

  if (!rangeEndKey) {
    if (tapped === rangeStartKey) {
      return { startKey: null, endKey: null };
    }
    if (tapped < rangeStartKey) {
      return { startKey: tapped, endKey: rangeStartKey };
    }
    return { startKey: rangeStartKey, endKey: tapped };
  }

  return { startKey: tapped, endKey: null };
}

export function normalizeTimeOffBlocksForSave(blocks) {
  if (!Array.isArray(blocks)) return [];
  return blocks
    .map((b) => {
      const id = String(b?.id ?? '').trim();
      const range = resolveTimeOffDateRange(b);
      const allDay = Boolean(b?.all_day ?? b?.allDay);
      const titleRaw = b?.title == null ? '' : String(b.title);
      const title = titleRaw.trim().slice(0, 500);

      let start = normalizeHourMinute(b?.start_time ?? b?.startTime);
      let end = normalizeHourMinute(b?.end_time ?? b?.endTime);
      if (allDay) {
        start = TIME_OFF_ALL_DAY_START;
        end = TIME_OFF_ALL_DAY_END;
      }

      if (!id || !range || !start || !end) return null;

      const isSingleDay = range.startDate === range.endDate;
      return {
        id,
        start_date: range.startDate,
        end_date: range.endDate,
        ...(isSingleDay ? { date: range.startDate } : {}),
        all_day: allDay,
        start_time: start,
        end_time: end,
        title: title || undefined,
      };
    })
    .filter(Boolean);
}

export function validateTimeOffBlocks(blocks) {
  if (!Array.isArray(blocks)) return 'Time off blocks must be an array.';
  if (blocks.length > 200) return 'Time off supports up to 200 blocks.';

  for (let i = 0; i < blocks.length; i += 1) {
    const b = blocks[i];
    if (!String(b?.id ?? '').trim()) return 'Each time off block requires an id.';
    if (String(b.id).trim().length > 80) return 'Time off id is too long.';

    const range = resolveTimeOffDateRange(b);
    if (!range) {
      return 'Each time off block needs a valid start and end date.';
    }

    const allDay = Boolean(b?.all_day ?? b?.allDay);
    if (allDay) {
      if (b?.title != null && String(b.title).trim().length > 500) {
        return 'Time off title is too long.';
      }
      continue;
    }

    const startMinutes = timeToMinutes(b?.start_time ?? b?.startTime);
    const endMinutes = timeToMinutes(b?.end_time ?? b?.endTime);
    if (startMinutes == null || endMinutes == null) {
      return 'Each time off block requires start and end times.';
    }
    if (endMinutes <= startMinutes) {
      return 'Each time off block must end after it starts.';
    }
    if (b?.title != null && String(b.title).trim().length > 500) {
      return 'Time off title is too long.';
    }
  }
  return '';
}
