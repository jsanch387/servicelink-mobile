/**
 * Lazy-load expo-store-review so OTA bundles stay safe on store binaries that
 * predate the native module (e.g. App Store 1.0.6 before 1.0.7 ships).
 */
export async function loadStoreReviewModule() {
  try {
    return await import('expo-store-review');
  } catch {
    return null;
  }
}
