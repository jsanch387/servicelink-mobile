import { computeHomeErrorPresentation, homeErrorDedupKey } from '../utils/homeErrorPresentation';

describe('homeErrorDedupKey', () => {
  it('treats TypeError network failures as one key', () => {
    expect(homeErrorDedupKey('TypeError: Network request failed')).toBe(
      homeErrorDedupKey('Network request failed'),
    );
  });
});

describe('computeHomeErrorPresentation', () => {
  it('hoists business error to banner and strips duplicate card errors', () => {
    const net = 'TypeError: Network request failed';
    const out = computeHomeErrorPresentation({
      businessError: net,
      bookingsError: net,
      todayBookingsError: net,
    });
    expect(out.bannerError).toBe(net);
    expect(out.nextUpBookingsError).toBeNull();
    expect(out.restOfTodayError).toBeNull();
    expect(out.linkSectionDegraded).toBe(true);
  });

  it('merges bookings + today when messages match', () => {
    const msg = 'Network request failed';
    const out = computeHomeErrorPresentation({
      businessError: null,
      bookingsError: msg,
      todayBookingsError: `TypeError: ${msg}`,
    });
    expect(out.bannerError).toBe(msg);
    expect(out.nextUpBookingsError).toBeNull();
    expect(out.restOfTodayError).toBeNull();
  });

  it('keeps distinct errors on their cards', () => {
    const out = computeHomeErrorPresentation({
      businessError: null,
      bookingsError: 'Could not load bookings',
      todayBookingsError: 'Different issue',
    });
    expect(out.bannerError).toBeNull();
    expect(out.nextUpBookingsError).toBe('Could not load bookings');
    expect(out.restOfTodayError).toBe('Different issue');
  });
});
