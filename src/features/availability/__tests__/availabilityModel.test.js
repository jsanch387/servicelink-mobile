import {
  buildAvailabilityUiFromPreset,
  buildAvailabilityUiModel,
  buildWeeklySchedulePayloadFromUi,
  format24HourTo12Hour,
  normalizeTimeOffBlocksForSave,
  to24Hour,
  validateTimeOffBlocks,
} from '../utils/availabilityModel';

describe('availabilityModel', () => {
  describe('time conversion', () => {
    it('converts 12-hour time to 24-hour time', () => {
      expect(to24Hour('9:00 AM')).toBe('09:00');
      expect(to24Hour('12:00 PM')).toBe('12:00');
      expect(to24Hour('12:00 AM')).toBe('00:00');
      expect(to24Hour('6:30 PM')).toBe('18:30');
    });

    it('converts 24-hour time to 12-hour time', () => {
      expect(format24HourTo12Hour('09:00')).toBe('9:00 AM');
      expect(format24HourTo12Hour('12:00')).toBe('12:00 PM');
      expect(format24HourTo12Hour('00:00')).toBe('12:00 AM');
      expect(format24HourTo12Hour('18:30')).toBe('6:30 PM');
    });
  });

  describe('buildAvailabilityUiFromPreset', () => {
    it('enables Mon–Fri 9–5 for mon_fri_9_5', () => {
      const ui = buildAvailabilityUiFromPreset('mon_fri_9_5');
      expect(ui.selectedPreset).toBe('mon_fri_9_5');
      expect(ui.dayEnabledMap.Monday).toBe(true);
      expect(ui.dayEnabledMap.Saturday).toBe(false);
      expect(ui.dayTimeRanges.Monday).toEqual({ start: '9:00 AM', end: '5:00 PM' });
    });

    it('enables Mon–Sat with 8–6 for mon_sat_8_6', () => {
      const ui = buildAvailabilityUiFromPreset('mon_sat_8_6');
      expect(ui.selectedPreset).toBe('mon_sat_8_6');
      expect(ui.dayEnabledMap.Sunday).toBe(false);
      expect(ui.dayTimeRanges.Monday).toEqual({ start: '8:00 AM', end: '6:00 PM' });
    });

    it('enables only weekends for weekends_only', () => {
      const ui = buildAvailabilityUiFromPreset('weekends_only');
      expect(ui.selectedPreset).toBe('weekends_only');
      expect(ui.dayEnabledMap.Monday).toBe(false);
      expect(ui.dayEnabledMap.Saturday).toBe(true);
    });
  });

  describe('buildAvailabilityUiModel', () => {
    it('maps weekly_schedule and time_off_blocks to UI model', () => {
      const model = buildAvailabilityUiModel({
        accept_bookings: true,
        selected_preset: 'custom',
        weekly_schedule: {
          monday: { start: '08:00', end: '16:30', enabled: true },
          tuesday: { start: '09:00', end: '17:00', enabled: false },
          wednesday: { start: '09:00', end: '17:00', enabled: true },
          thursday: { start: '09:00', end: '17:00', enabled: true },
          friday: { start: '09:00', end: '17:00', enabled: true },
          saturday: { start: '10:00', end: '14:00', enabled: false },
          sunday: { start: '10:00', end: '14:00', enabled: false },
        },
        time_off_blocks: [{ id: 'a', date: '2026-04-27', start_time: '09:00', end_time: '10:00' }],
      });

      expect(model.acceptBookings).toBe(true);
      expect(model.selectedPreset).toBe('custom');
      expect(model.dayEnabledMap.Monday).toBe(true);
      expect(model.dayEnabledMap.Tuesday).toBe(false);
      expect(model.dayTimeRanges.Monday).toEqual({ start: '8:00 AM', end: '4:30 PM' });
      expect(model.timeOffBlocks).toHaveLength(1);
    });
  });

  describe('buildWeeklySchedulePayloadFromUi', () => {
    it('builds server payload with HH:mm values and enabled flags', () => {
      const payload = buildWeeklySchedulePayloadFromUi(
        {
          Monday: true,
          Tuesday: false,
          Wednesday: true,
          Thursday: true,
          Friday: true,
          Saturday: false,
          Sunday: false,
        },
        {
          Monday: { start: '9:00 AM', end: '5:30 PM' },
          Tuesday: { start: '9:00 AM', end: '5:00 PM' },
          Wednesday: { start: '9:00 AM', end: '5:00 PM' },
          Thursday: { start: '9:00 AM', end: '5:00 PM' },
          Friday: { start: '9:00 AM', end: '5:00 PM' },
          Saturday: { start: '9:00 AM', end: '5:00 PM' },
          Sunday: { start: '9:00 AM', end: '5:00 PM' },
        },
      );

      expect(payload.monday).toEqual({ enabled: true, start: '09:00', end: '17:30' });
      expect(payload.tuesday.enabled).toBe(false);
    });
  });

  describe('time off normalize + validate', () => {
    it('normalizes mixed camel/snake fields and trims title', () => {
      const normalized = normalizeTimeOffBlocksForSave([
        {
          id: ' id-1 ',
          date: '2026-04-27',
          startTime: '9:12 AM',
          endTime: '10:46 AM',
          title: '  Dentist  ',
        },
      ]);

      expect(normalized[0]).toEqual({
        id: 'id-1',
        date: '2026-04-27',
        start_time: '09:00',
        end_time: '10:30',
        title: 'Dentist',
      });
    });

    it('rejects invalid blocks (end before start)', () => {
      const error = validateTimeOffBlocks([
        {
          id: 'id-1',
          date: '2026-04-27',
          start_time: '13:00',
          end_time: '12:00',
        },
      ]);
      expect(error).toMatch(/end after it starts/i);
    });

    it('accepts valid blocks', () => {
      const error = validateTimeOffBlocks([
        {
          id: 'id-1',
          date: '2026-04-27',
          start_time: '09:00',
          end_time: '12:00',
        },
      ]);
      expect(error).toBe('');
    });
  });
});
