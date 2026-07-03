import AsyncStorage from '@react-native-async-storage/async-storage';

/** AsyncStorage: set when a push is tapped before main tabs are reachable; consumed once after sign-in. */
export const PENDING_PUSH_NAVIGATION_KEY = 'servicelink.pendingPushNavigation';

/**
 * @param {Record<string, unknown>} data Expo push `data` payload.
 */
export async function storePendingPushNavigation(data) {
  try {
    await AsyncStorage.setItem(PENDING_PUSH_NAVIGATION_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

/** @returns {Promise<Record<string, unknown> | null>} */
export async function consumePendingPushNavigation() {
  try {
    const raw = await AsyncStorage.getItem(PENDING_PUSH_NAVIGATION_KEY);
    if (!raw) {
      return null;
    }
    await AsyncStorage.removeItem(PENDING_PUSH_NAVIGATION_KEY);
    return JSON.parse(raw);
  } catch {
    try {
      await AsyncStorage.removeItem(PENDING_PUSH_NAVIGATION_KEY);
    } catch {
      /* ignore */
    }
    return null;
  }
}
