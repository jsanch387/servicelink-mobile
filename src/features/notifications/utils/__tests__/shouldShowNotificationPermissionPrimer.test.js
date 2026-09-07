import { shouldShowNotificationPermissionPrimer } from '../shouldShowNotificationPermissionPrimer';

describe('shouldShowNotificationPermissionPrimer', () => {
  it('shows only while permission is still undetermined', () => {
    expect(
      shouldShowNotificationPermissionPrimer({
        platform: 'ios',
        permissionStatus: 'undetermined',
        hasSeenPrimer: false,
      }),
    ).toBe(true);
  });

  it('hides after the owner already saw the primer', () => {
    expect(
      shouldShowNotificationPermissionPrimer({
        platform: 'ios',
        permissionStatus: 'undetermined',
        hasSeenPrimer: true,
      }),
    ).toBe(false);
  });

  it('hides when permission is already decided or unavailable', () => {
    expect(
      shouldShowNotificationPermissionPrimer({
        platform: 'ios',
        permissionStatus: 'granted',
        hasSeenPrimer: false,
      }),
    ).toBe(false);
    expect(
      shouldShowNotificationPermissionPrimer({
        platform: 'ios',
        permissionStatus: 'denied',
        hasSeenPrimer: false,
      }),
    ).toBe(false);
    expect(
      shouldShowNotificationPermissionPrimer({
        platform: 'web',
        permissionStatus: 'undetermined',
        hasSeenPrimer: false,
      }),
    ).toBe(false);
  });
});
