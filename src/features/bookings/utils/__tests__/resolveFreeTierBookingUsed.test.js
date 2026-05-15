import { resolveFreeTierBookingUsed } from '../resolveFreeTierBookingUsed';

describe('resolveFreeTierBookingUsed', () => {
  it('returns head count when profile column is absent', () => {
    expect(resolveFreeTierBookingUsed({ id: 'b1' }, 3)).toBe(3);
    expect(resolveFreeTierBookingUsed({ id: 'b1', free_bookings_count: null }, 3)).toBe(3);
  });

  it('prefers free_bookings_count from the business row when it is a finite number', () => {
    expect(resolveFreeTierBookingUsed({ id: 'b1', free_bookings_count: 5 }, 0)).toBe(5);
    expect(resolveFreeTierBookingUsed({ id: 'b1', free_bookings_count: 5 }, 5)).toBe(5);
  });

  it('ignores non-numeric profile values and falls back to head count', () => {
    expect(resolveFreeTierBookingUsed({ id: 'b1', free_bookings_count: '5' }, 2)).toBe(2);
    expect(resolveFreeTierBookingUsed({ id: 'b1', free_bookings_count: NaN }, 2)).toBe(2);
  });
});
