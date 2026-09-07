import { formatElapsedJobClock } from '../formatElapsedJobClock';

describe('formatElapsedJobClock', () => {
  it('formats minutes and seconds', () => {
    expect(formatElapsedJobClock(0)).toBe('0:00');
    expect(formatElapsedJobClock(12_000)).toBe('0:12');
    expect(formatElapsedJobClock(75_000)).toBe('1:15');
  });

  it('includes hours after 60 minutes', () => {
    expect(formatElapsedJobClock(3_661_000)).toBe('1:01:01');
  });
});
