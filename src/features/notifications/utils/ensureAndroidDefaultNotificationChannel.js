import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { ANDROID_PUSH_CHANNEL_ID, ANDROID_PUSH_CHANNEL_NAME } from '../constants/pushAlertSetup';

/**
 * Android channel matching server `channelId: "default"`.
 * Sound + vibration must be on at create time — Android will not add them later.
 */
export const ANDROID_DEFAULT_PUSH_CHANNEL = Object.freeze({
  name: ANDROID_PUSH_CHANNEL_NAME,
  importance: Notifications.AndroidImportance.HIGH,
  sound: 'default',
  enableVibrate: true,
  vibrationPattern: [0, 250, 250, 250],
  enableLights: true,
  lightColor: '#0a0a0a',
  showBadge: true,
});

/**
 * @param {{ sound?: string | null; enableVibrate?: boolean } | null | undefined} channel
 * @returns {boolean}
 */
export function androidPushChannelNeedsRecreate(channel) {
  if (!channel) return false;
  const sound = channel.sound == null ? '' : String(channel.sound).trim();
  return !sound;
}

/**
 * Creates (or repairs) the ServiceLink Android channel so Expo `sound: "default"`
 * and vibration are not swallowed. No-op on iOS / web.
 */
export async function ensureAndroidDefaultNotificationChannel() {
  if (Platform.OS !== 'android') {
    return;
  }

  const existing = await Notifications.getNotificationChannelAsync(ANDROID_PUSH_CHANNEL_ID);
  if (androidPushChannelNeedsRecreate(existing)) {
    await Notifications.deleteNotificationChannelAsync(ANDROID_PUSH_CHANNEL_ID);
  }

  await Notifications.setNotificationChannelAsync(
    ANDROID_PUSH_CHANNEL_ID,
    ANDROID_DEFAULT_PUSH_CHANNEL,
  );
}
