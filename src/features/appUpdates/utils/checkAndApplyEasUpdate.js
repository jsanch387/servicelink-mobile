import * as Updates from 'expo-updates';

/**
 * Checks EAS Update for a newer JS bundle and reloads when one is available.
 * No-op in dev clients and when expo-updates is disabled (e.g. Expo Go).
 */
export async function checkAndApplyEasUpdate() {
  if (__DEV__ || !Updates.isEnabled) {
    return { applied: false, reason: 'disabled' };
  }

  try {
    const check = await Updates.checkForUpdateAsync();
    if (!check.isAvailable) {
      return { applied: false, reason: 'none' };
    }

    await Updates.fetchUpdateAsync();
    await Updates.reloadAsync();
    return { applied: true };
  } catch {
    return { applied: false, reason: 'error' };
  }
}
