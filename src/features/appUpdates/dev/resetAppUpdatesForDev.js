import { DeviceEventEmitter } from 'react-native';
import { clearSeenAppUpdateAnnouncements } from '../storage/seenAnnouncements';

export const APP_UPDATES_DEV_RESET_EVENT = 'servicelink.appUpdates.devReset';

/** Dev only — clears seen announcements and re-shows the next pending modal. */
export async function resetAppUpdatesForDev() {
  if (typeof __DEV__ === 'undefined' || !__DEV__) {
    return;
  }
  await clearSeenAppUpdateAnnouncements();
  DeviceEventEmitter.emit(APP_UPDATES_DEV_RESET_EVENT);
}
