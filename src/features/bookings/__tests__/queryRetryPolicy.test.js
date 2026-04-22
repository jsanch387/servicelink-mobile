import { shouldRetryBookingsQuery } from '../utils/queryRetryPolicy';

describe('shouldRetryBookingsQuery', () => {
  it('retries transient network-like failures once', () => {
    expect(shouldRetryBookingsQuery(0, new Error('Network request failed'))).toBe(true);
    expect(shouldRetryBookingsQuery(0, new Error('503 Service Unavailable'))).toBe(true);
  });

  it('does not retry deterministic failures', () => {
    expect(shouldRetryBookingsQuery(0, new Error('Booking not found'))).toBe(false);
    expect(shouldRetryBookingsQuery(0, new Error('RLS blocked'))).toBe(false);
  });

  it('does not retry after the first retry attempt', () => {
    expect(shouldRetryBookingsQuery(1, new Error('Network request failed'))).toBe(false);
  });
});
