import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';

/**
 * Remote Android push was removed from Expo Go in SDK 53. Evaluating `expo-notifications`
 * throws there, so callers must load it through this helper.
 */
export function isAndroidExpoGo() {
  return Platform.OS === 'android' && isRunningInExpoGo();
}

export function loadExpoNotifications() {
  if (isAndroidExpoGo()) {
    return null;
  }
  return require('expo-notifications');
}
