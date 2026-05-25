import { mapMaintenanceDeleteError } from '../api/mapMaintenanceDeleteError';

describe('mapMaintenanceDeleteError', () => {
  it('maps RLS permission errors', () => {
    expect(mapMaintenanceDeleteError({ code: '42501', message: 'permission denied' })).toBe(
      'You do not have permission to remove this maintenance detail.',
    );
  });

  it('falls back to error message', () => {
    expect(mapMaintenanceDeleteError(new Error('Custom failure'))).toBe('Custom failure');
  });
});
