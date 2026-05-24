import { mapMaintenanceFetchError } from '../api/mapMaintenanceFetchError';

describe('mapMaintenanceFetchError', () => {
  it('maps missing column errors to friendly copy', () => {
    expect(
      mapMaintenanceFetchError({
        code: '42703',
        message: 'column maintenance_enrollments.invite_token does not exist',
      }),
    ).toBe('Maintenance data is temporarily unavailable. Pull down to refresh.');
  });

  it('maps permission errors', () => {
    expect(
      mapMaintenanceFetchError({
        code: '42501',
        message: 'permission denied for table maintenance_enrollments',
      }),
    ).toBe('We could not load maintenance offers for this account.');
  });
});
