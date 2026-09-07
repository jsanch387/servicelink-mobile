import AsyncStorage from '@react-native-async-storage/async-storage';

export const NOTIFICATION_PERMISSION_PRIMER_SEEN_PREFIX =
  '@servicelink/notificationPermissionPrimer.seen:';

export function notificationPermissionPrimerSeenKey(userId) {
  return `${NOTIFICATION_PERMISSION_PRIMER_SEEN_PREFIX}${String(userId ?? '').trim()}`;
}

export async function hasSeenNotificationPermissionPrimer(userId) {
  const id = String(userId ?? '').trim();
  if (!id) {
    return false;
  }
  try {
    const value = await AsyncStorage.getItem(notificationPermissionPrimerSeenKey(id));
    return value === '1';
  } catch {
    return false;
  }
}

export async function markNotificationPermissionPrimerSeen(userId) {
  const id = String(userId ?? '').trim();
  if (!id) {
    return;
  }
  try {
    await AsyncStorage.setItem(notificationPermissionPrimerSeenKey(id), '1');
  } catch {
    /* ignore */
  }
}
