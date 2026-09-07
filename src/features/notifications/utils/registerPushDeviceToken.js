import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { upsertPushDeviceToken } from '../api/upsertPushDeviceToken';
import { PUSH_PERMISSION_REQUEST } from '../constants/pushAlertSetup';
import { ensureAndroidDefaultNotificationChannel } from './ensureAndroidDefaultNotificationChannel';

function resolveExpoProjectId() {
  return Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId ?? undefined;
}

async function upsertGrantedPushToken(userId) {
  const projectId = resolveExpoProjectId();
  const tokenResult = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined,
  );
  const token = tokenResult.data;
  if (!token) {
    return { ok: false, reason: 'no_token', status: 'granted' };
  }

  await upsertPushDeviceToken(userId, token, Platform.OS === 'ios' ? 'ios' : 'android');
  return { ok: true, status: 'granted', token };
}

/**
 * Saves the Expo push token when the OS has already granted permission.
 * Does not present the system prompt.
 *
 * @param {string | null | undefined} userId
 */
export async function registerPushDeviceTokenIfGranted(userId) {
  const id = String(userId ?? '').trim();
  if (Platform.OS === 'web' || !id) {
    return { ok: false, reason: 'unavailable' };
  }

  try {
    await ensureAndroidDefaultNotificationChannel();
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      return { ok: false, reason: 'not_granted', status };
    }
    return upsertGrantedPushToken(id);
  } catch {
    return { ok: false, reason: 'error' };
  }
}

/**
 * Presents the system permission prompt (if still undetermined), then registers the token.
 *
 * @param {string | null | undefined} userId
 */
export async function requestPushPermissionAndRegister(userId) {
  const id = String(userId ?? '').trim();
  if (Platform.OS === 'web' || !id) {
    return { ok: false, reason: 'unavailable' };
  }

  try {
    await ensureAndroidDefaultNotificationChannel();
    const { status: existing } = await Notifications.getPermissionsAsync();
    let status = existing;
    if (existing !== 'granted') {
      const requested = await Notifications.requestPermissionsAsync(PUSH_PERMISSION_REQUEST);
      status = requested.status;
    }
    if (status !== 'granted') {
      return { ok: false, reason: 'not_granted', status };
    }
    return upsertGrantedPushToken(id);
  } catch {
    return { ok: false, reason: 'error' };
  }
}
