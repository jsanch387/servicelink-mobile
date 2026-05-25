import { getMaintenanceStatusPillTheme } from '../utils/maintenanceStatusPillTheme';

const colors = {
  borderStrong: '#ccc',
  border: '#ddd',
  danger: '#dc2626',
  text: '#111',
  textMuted: '#666',
  textSecondary: '#444',
};

describe('getMaintenanceStatusPillTheme', () => {
  it('uses blue for completed (visit_completed) like bookings', () => {
    const theme = getMaintenanceStatusPillTheme('visit_completed', colors, false);
    expect(theme.color).toBe('#1e40af');
    expect(theme.backgroundColor).toBe('rgba(125,211,252,0.16)');
  });

  it('uses green for confirmed (accepted)', () => {
    const theme = getMaintenanceStatusPillTheme('accepted', colors, false);
    expect(theme.color).toBe('#15803d');
    expect(theme.backgroundColor).toBe('rgba(22,163,74,0.12)');
  });
});
