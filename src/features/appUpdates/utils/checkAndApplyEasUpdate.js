import * as Updates from 'expo-updates';

/**
 * Downloads a newer EAS Update JS bundle when available.
 * Applies on the next cold start (native EXUpdatesCheckOnLaunch) to avoid
 * reload crashes/flashes mid-session on legacy store binaries.
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
    return { applied: false, reason: 'downloaded' };
  } catch {
    return { applied: false, reason: 'error' };
  }
}
