export const PRESET_OPTIONS = [
  { value: 'mon_fri_9_5', label: 'Mon–Fri 9–5' },
  { value: 'mon_sat_8_6', label: 'Mon–Sat 8–6' },
  { value: 'weekends_only', label: 'Weekends' },
  { value: 'custom', label: 'Custom' },
];

export const DAY_DEFINITIONS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

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

export function normalizeTimeOffBlocksForSave(blocks) {
  if (!Array.isArray(blocks)) return [];
  return blocks
    .map((b) => {
      const id = String(b?.id ?? '').trim();
      const date = String(b?.date ?? '').trim();
      const start = normalizeHourMinute(b?.start_time ?? b?.startTime);
      const end = normalizeHourMinute(b?.end_time ?? b?.endTime);
      const titleRaw = b?.title == null ? '' : String(b.title);
      const title = titleRaw.trim().slice(0, 500);
      return {
        id,
        date,
        start_time: start,
        end_time: end,
        title: title || undefined,
      };
    })
    .filter((b) => Boolean(b.id && b.date && b.start_time && b.end_time));
}

export function validateTimeOffBlocks(blocks) {
  if (!Array.isArray(blocks)) return 'Time off blocks must be an array.';
  if (blocks.length > 200) return 'Time off supports up to 200 blocks.';

  for (let i = 0; i < blocks.length; i += 1) {
    const b = blocks[i];
    if (!String(b?.id ?? '').trim()) return 'Each time off block requires an id.';
    if (String(b.id).trim().length > 80) return 'Time off id is too long.';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(b?.date ?? '').trim())) {
      return 'Each time off date must use YYYY-MM-DD format.';
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
