import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { ANDROID_PUSH_CHANNEL_ID } from '../constants/pushAlertSetup';
import {
  ANDROID_DEFAULT_PUSH_CHANNEL,
  androidPushChannelNeedsRecreate,
  ensureAndroidDefaultNotificationChannel,
} from '../utils/ensureAndroidDefaultNotificationChannel';

describe('androidPushChannelNeedsRecreate', () => {
  it('is false when there is no existing channel', () => {
    expect(androidPushChannelNeedsRecreate(null)).toBe(false);
  });

  it('is true when the existing channel has no sound', () => {
    expect(androidPushChannelNeedsRecreate({ sound: null, enableVibrate: true })).toBe(true);
    expect(androidPushChannelNeedsRecreate({ sound: '', enableVibrate: true })).toBe(true);
  });

  it('does not recreate when the user only turned vibration off', () => {
    expect(androidPushChannelNeedsRecreate({ sound: 'default', enableVibrate: false })).toBe(false);
  });

  it('is false when sound and vibration are already on', () => {
    expect(androidPushChannelNeedsRecreate({ sound: 'default', enableVibrate: true })).toBe(false);
  });
});

describe('ensureAndroidDefaultNotificationChannel', () => {
  const originalOs = Platform.OS;

  afterEach(() => {
    Platform.OS = originalOs;
    jest.clearAllMocks();
  });

  it('does nothing off Android', async () => {
    Platform.OS = 'ios';
    await ensureAndroidDefaultNotificationChannel();
    expect(Notifications.setNotificationChannelAsync).not.toHaveBeenCalled();
  });

  it('creates the ServiceLink default channel with sound and vibration', async () => {
    Platform.OS = 'android';
    Notifications.getNotificationChannelAsync.mockResolvedValueOnce(null);

    await ensureAndroidDefaultNotificationChannel();

    expect(Notifications.deleteNotificationChannelAsync).not.toHaveBeenCalled();
    expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledWith(
      ANDROID_PUSH_CHANNEL_ID,
      ANDROID_DEFAULT_PUSH_CHANNEL,
    );
    expect(ANDROID_DEFAULT_PUSH_CHANNEL.sound).toBe('default');
    expect(ANDROID_DEFAULT_PUSH_CHANNEL.enableVibrate).toBe(true);
    expect(ANDROID_DEFAULT_PUSH_CHANNEL.importance).toBe(Notifications.AndroidImportance.HIGH);
  });

  it('deletes and recreates a silent existing channel', async () => {
    Platform.OS = 'android';
    Notifications.getNotificationChannelAsync.mockResolvedValueOnce({
      sound: null,
      enableVibrate: true,
    });

    await ensureAndroidDefaultNotificationChannel();

    expect(Notifications.deleteNotificationChannelAsync).toHaveBeenCalledWith(
      ANDROID_PUSH_CHANNEL_ID,
    );
    expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledWith(
      ANDROID_PUSH_CHANNEL_ID,
      ANDROID_DEFAULT_PUSH_CHANNEL,
    );
  });
});
