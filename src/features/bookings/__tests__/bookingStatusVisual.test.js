import { getBookingStatusLabel, getBookingStatusVisualKind } from '../utils/bookingStatusVisual';

describe('getBookingStatusVisualKind', () => {
  it('maps cancelled and completed', () => {
    expect(getBookingStatusVisualKind('cancelled')).toBe('cancelled');
    expect(getBookingStatusVisualKind('Canceled')).toBe('cancelled');
    expect(getBookingStatusVisualKind('completed')).toBe('completed');
  });

  it('treats confirmed and unknown as scheduled', () => {
    expect(getBookingStatusVisualKind('confirmed')).toBe('scheduled');
    expect(getBookingStatusVisualKind(undefined)).toBe('scheduled');
  });
});

describe('getBookingStatusLabel', () => {
  it('returns readable labels', () => {
    expect(getBookingStatusLabel('confirmed')).toBe('Upcoming');
    expect(getBookingStatusLabel('completed')).toBe('Completed');
    expect(getBookingStatusLabel('cancelled')).toBe('Cancelled');
  });
});
