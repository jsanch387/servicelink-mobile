import {
  formatNextUpWhenLine,
  formatStartsRelative,
  localYyyyMmDd,
  parseBookingStartLocalMs,
} from '../utils/bookingStart';

describe('parseBookingStartLocalMs', () => {
  it('returns NaN when date missing', () => {
    expect(parseBookingStartLocalMs(null, '10:00:00')).toBeNaN();
    expect(parseBookingStartLocalMs('', '10:00:00')).toBeNaN();
  });

  it('uses start of day when time is null or empty', () => {
    const ms = parseBookingStartLocalMs('2026-01-01', null);
    expect(Number.isFinite(ms)).toBe(true);
    const d = new Date(ms);
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
  });

  it('parses date and time into epoch ms', () => {
    const ms = parseBookingStartLocalMs('2026-03-15', '14:30:00');
    expect(Number.isFinite(ms)).toBe(true);
    const d = new Date(ms);
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(2);
    expect(d.getDate()).toBe(15);
  });

  it('accepts ISO date strings and HH:mm times from APIs', () => {
    const ms = parseBookingStartLocalMs('2026-03-15T00:00:00.000Z', '10:00');
    expect(Number.isFinite(ms)).toBe(true);
    const d = new Date(ms);
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(2);
    expect(d.getDate()).toBe(15);
  });
});

describe('localYyyyMmDd', () => {
  it('formats a fixed date in local calendar', () => {
    const d = new Date(2026, 0, 7, 15, 30, 0);
    expect(localYyyyMmDd(d)).toBe('2026-01-07');
  });
});

describe('formatStartsRelative', () => {
  it('returns empty for non-finite diff', () => {
    expect(formatStartsRelative(NaN, 0)).toBe('');
  });

  it('returns Starting soon under one minute', () => {
    expect(formatStartsRelative(1000, 0)).toBe('Starting soon');
  });

  it('uses minutes under one hour', () => {
    expect(formatStartsRelative(30 * 60 * 1000, 0)).toBe('Starts in 30 mins');
    expect(formatStartsRelative(60 * 1000, 0)).toBe('Starts in 1 min');
  });

  it('uses hours under 48 hours', () => {
    expect(formatStartsRelative(2 * 60 * 60 * 1000, 0)).toBe('Starts in 2 hours');
    expect(formatStartsRelative(60 * 60 * 1000, 0)).toBe('Starts in 1 hour');
  });

  it('uses days at 48+ hours', () => {
    expect(formatStartsRelative(72 * 60 * 60 * 1000, 0)).toBe('Starts in 3 days');
  });
});

describe('formatNextUpWhenLine', () => {
  it('returns empty for invalid times', () => {
    expect(formatNextUpWhenLine(NaN, 0)).toBe('');
    expect(formatNextUpWhenLine(1000, 2000)).toBe('');
  });

  it('shows soon under 45 seconds', () => {
    expect(formatNextUpWhenLine(30_000, 0)).toBe('Starting soon');
  });

  it('shows time and minutes when same day and under one hour', () => {
    const now = new Date(2026, 3, 29, 9, 30, 0).getTime();
    const start = new Date(2026, 3, 29, 10, 0, 0).getTime();
    expect(formatNextUpWhenLine(start, now)).toMatch(/min/);
    expect(formatNextUpWhenLine(start, now)).toMatch(/10:00/);
  });

  it('shows Today when same calendar day and over an hour out', () => {
    const now = new Date(2026, 3, 29, 6, 0, 0).getTime();
    const start = new Date(2026, 3, 29, 15, 0, 0).getTime();
    expect(formatNextUpWhenLine(start, now)).toMatch(/Today at/);
  });

  it('spells out the next calendar day as Tomorrow', () => {
    const now = new Date(2026, 3, 29, 20, 0, 0).getTime();
    const start = new Date(2026, 3, 30, 9, 0, 0).getTime();
    expect(formatNextUpWhenLine(start, now)).toMatch(/Tomorrow at/);
  });

  it('shows weekday for appointments a few days out', () => {
    const now = new Date(2026, 3, 29, 8, 0, 0).getTime();
    const start = new Date(2026, 4, 2, 10, 30, 0).getTime();
    const line = formatNextUpWhenLine(start, now);
    expect(line).toMatch(/May/);
    expect(line).toMatch(/10:30/);
    expect(line).toMatch(/at/);
  });
});
