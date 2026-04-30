import {
  getPlannerDayMetrics,
  layoutPlannerDay,
  plannerDurationMinutes,
  timeStringToMinutesSinceMidnight,
} from '../utils/plannerDayLayout';

describe('timeStringToMinutesSinceMidnight', () => {
  it('parses HH:mm:ss and HH:mm', () => {
    expect(timeStringToMinutesSinceMidnight('09:30:00')).toBe(9 * 60 + 30);
    expect(timeStringToMinutesSinceMidnight('9:30')).toBe(9 * 60 + 30);
  });
});

describe('plannerDurationMinutes', () => {
  it('defaults when missing', () => {
    expect(plannerDurationMinutes({ duration_minutes: null })).toBe(60);
    expect(plannerDurationMinutes({ duration_minutes: 90 })).toBe(90);
  });
});

describe('layoutPlannerDay', () => {
  it('shows 6 AM through 10 PM hour rows when empty', () => {
    const layout = layoutPlannerDay([]);
    expect(layout.startHour).toBe(6);
    expect(layout.endHour).toBe(23);
    expect(layout.numHours).toBe(17);
    expect(layout.hourLabels).toEqual(expect.arrayContaining([6, 12, 22]));
    expect(layout.hourLabels).toHaveLength(17);
    expect(layout.windowSpanMin).toBe(17 * 60);
    expect(layout.pxPerMinute).toBeCloseTo((17 * 52) / (17 * 60), 5);
  });

  it('getPlannerDayMetrics matches default window', () => {
    const m = getPlannerDayMetrics();
    expect(m.START_HOUR).toBe(6);
    expect(m.END_HOUR_INCLUSIVE).toBe(22);
    expect(m.numHours).toBe(17);
    expect(m.timelineHeightPx).toBe(17 * 52);
  });

  it('returns blocks with positions for one booking', () => {
    const layout = layoutPlannerDay([
      {
        id: '1',
        scheduled_date: '2026-06-01',
        start_time: '10:00:00',
        duration_minutes: 60,
        status: 'confirmed',
        service_name: 'Cut',
        customer_name: 'A',
      },
    ]);
    expect(layout.blocks).toHaveLength(1);
    expect(layout.blocks[0].booking.id).toBe('1');
    expect(layout.blocks[0].height).toBeGreaterThan(0);
    expect(layout.blocks[0].startMin).toBe(10 * 60);
  });

  it('keeps same-column stacked blocks from overlapping vertically', () => {
    const layout = layoutPlannerDay(
      [
        {
          id: 'a',
          scheduled_date: '2026-06-01',
          start_time: '09:00:00',
          duration_minutes: 60,
          status: 'cancelled',
          service_name: 'Paint correction',
          customer_name: 'Jacob',
        },
        {
          id: 'b',
          scheduled_date: '2026-06-01',
          start_time: '10:00:00',
          duration_minutes: 180,
          status: 'completed',
          service_name: 'Signature Shine',
          customer_name: 'Jesus',
        },
      ],
      { hourHeightPx: 52 },
    );
    expect(layout.blocks).toHaveLength(2);
    const [first, second] = [...layout.blocks].sort((x, y) => x.top - y.top);
    expect(first.booking.id).toBe('a');
    expect(second.booking.id).toBe('b');
    expect(second.top).toBeGreaterThanOrEqual(first.top + first.height + 1);
  });
});
