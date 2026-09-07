import * as Notifications from 'expo-notifications';
import { upsertPushDeviceToken } from '../../api/upsertPushDeviceToken';
import {
  registerPushDeviceTokenIfGranted,
  requestPushPermissionAndRegister,
} from '../registerPushDeviceToken';

jest.mock('../../api/upsertPushDeviceToken', () => ({
  upsertPushDeviceToken: jest.fn(() => Promise.resolve()),
}));

jest.mock('../ensureAndroidDefaultNotificationChannel', () => ({
  ensureAndroidDefaultNotificationChannel: jest.fn(() => Promise.resolve()),
}));

describe('registerPushDeviceToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers when permission is already granted', async () => {
    Notifications.getPermissionsAsync.mockResolvedValue({ status: 'granted' });

    const result = await registerPushDeviceTokenIfGranted('user-1');

    expect(result.ok).toBe(true);
    expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
    expect(upsertPushDeviceToken).toHaveBeenCalledWith('user-1', 'ExponentPushToken[test]', 'ios');
  });

  it('does not prompt when only registering if granted', async () => {
    Notifications.getPermissionsAsync.mockResolvedValue({ status: 'undetermined' });

    const result = await registerPushDeviceTokenIfGranted('user-1');

    expect(result).toEqual({ ok: false, reason: 'not_granted', status: 'undetermined' });
    expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
    expect(upsertPushDeviceToken).not.toHaveBeenCalled();
  });

  it('prompts then registers from the primer', async () => {
    Notifications.getPermissionsAsync.mockResolvedValue({ status: 'undetermined' });
    Notifications.requestPermissionsAsync.mockResolvedValue({ status: 'granted' });

    const result = await requestPushPermissionAndRegister('user-1');

    expect(result.ok).toBe(true);
    expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
    expect(upsertPushDeviceToken).toHaveBeenCalled();
  });
});
