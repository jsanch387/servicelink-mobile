import {
  OWNER_OVERLAP_SAME_TIME,
  OWNER_OVERLAP_SAME_TIME_PICKER,
} from '../../constants/ownerBookingOverlapCopy';
import { resolveOwnerOverlapHeadsUp, startClockMinutes } from '../ownerBookingOverlap';

describe('startClockMinutes', () => {
  it('treats 9:00, 09:00, and 9:00 AM as the same clock', () => {
    expect(startClockMinutes('9:00')).toBe(9 * 60);
    expect(startClockMinutes('09:00')).toBe(9 * 60);
    expect(startClockMinutes('09:00:00')).toBe(9 * 60);
    expect(startClockMinutes('9:00 AM')).toBe(9 * 60);
  });

  it('does not treat 2:00 PM as 2:00', () => {
    expect(startClockMinutes('2:00 PM')).toBe(14 * 60);
    expect(startClockMinutes('14:00:00')).toBe(14 * 60);
  });

  it('reads a time from an ISO datetime', () => {
    expect(startClockMinutes('1970-01-01T09:00:00')).toBe(9 * 60);
    expect(startClockMinutes('2026-09-23T09:00:00.000Z')).toBe(9 * 60);
  });
});

describe('resolveOwnerOverlapHeadsUp', () => {
  const rows = [
    { id: 'a', scheduled_date: '2026-04-29', start_time: '10:00:00' },
    { id: 'b', scheduled_date: '2026-04-29', start_time: '14:00:00' },
  ];

  it('returns null when the day is empty', () => {
    expect(
      resolveOwnerOverlapHeadsUp({
        mode: 'create',
        dateKey: '2026-04-30',
        startTime: '10:00 AM',
        rows,
      }),
    ).toBeNull();
  });

  it('prefers the same-time warning', () => {
    expect(
      resolveOwnerOverlapHeadsUp({
        mode: 'create',
        dateKey: '2026-04-29',
        startTime: '10:00 AM',
        rows,
      }),
    ).toBe(OWNER_OVERLAP_SAME_TIME);
  });

  it('stays quiet when the day is busy but the start time is free', () => {
    expect(
      resolveOwnerOverlapHeadsUp({
        mode: 'create',
        dateKey: '2026-04-29',
        startTime: '11:00 AM',
        rows,
      }),
    ).toBeNull();
    expect(
      resolveOwnerOverlapHeadsUp({
        mode: 'reschedule',
        dateKey: '2026-04-29',
        startTime: '11:00 AM',
        rows,
      }),
    ).toBeNull();
  });

  it('uses a shorter picker heads-up on the date and time screen', () => {
    expect(
      resolveOwnerOverlapHeadsUp({
        mode: 'create',
        dateKey: '2026-04-29',
        startTime: '10:00 AM',
        rows,
        tone: 'picker',
      }),
    ).toBe(OWNER_OVERLAP_SAME_TIME_PICKER);
  });
});
