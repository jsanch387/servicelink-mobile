import {
  formatMaintenanceAnchor,
  formatMaintenanceAnchorDate,
  formatMaintenanceAnchorTime,
} from '../utils/formatMaintenanceDisplay';

describe('formatMaintenanceDisplay anchor', () => {
  it('formats date in a short human-readable form', () => {
    expect(formatMaintenanceAnchorDate('2026-06-15')).toBe('June 15, 2026');
  });

  it('formats ISO anchor dates from the database', () => {
    expect(formatMaintenanceAnchorDate('2026-06-15T00:00:00.000Z')).toBe('June 15, 2026');
  });

  it('formats time in 12h when date is set', () => {
    expect(formatMaintenanceAnchorTime('2026-06-15', '10:00:00')).toBe('10:00 AM');
  });

  it('returns not set when anchor date is missing', () => {
    expect(formatMaintenanceAnchorDate(null)).toBe('Not set yet');
    expect(formatMaintenanceAnchorTime(null, '10:00')).toBe('Not set yet');
  });

  it('combines date and time for legacy anchor label', () => {
    expect(formatMaintenanceAnchor('2026-06-15', '14:30:00')).toBe('June 15, 2026 · 2:30 PM');
  });
});
