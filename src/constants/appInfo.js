import Constants from 'expo-constants';
import { Platform } from 'react-native';

/** Matches `expo.name` in app.json — used when native config is unavailable (e.g. some tests). */
export const APP_DISPLAY_NAME = 'ServiceLink';

/**
 * Marketing version (`CFBundleShortVersionString` / `versionName`).
 * Source: `expo.version` in app.json (via expo-constants).
 */
export function getAppMarketingVersion() {
  return (
    Constants.expoConfig?.version ??
    Constants.nativeApplicationVersion ??
    process.env.EXPO_PUBLIC_APP_VERSION ??
    '0.0.0'
  );
}

/**
 * Platform build number (`CFBundleVersion` on iOS / `versionCode` on Android).
 * Source: `expo.ios.buildNumber` / `expo.android.versionCode` in app.json, or EAS auto-increment.
 */
export function getAppBuildNumber() {
  if (Platform.OS === 'ios') {
    const fromConfig = Constants.expoConfig?.ios?.buildNumber;
    const native = Constants.nativeBuildVersion;
    const value = native ?? fromConfig;
    return value != null && String(value).trim() !== '' ? String(value).trim() : null;
  }
  if (Platform.OS === 'android') {
    const code = Constants.expoConfig?.android?.versionCode;
    return code != null ? String(code) : null;
  }
  return null;
}

/**
 * Footer line for More / Account — e.g. `ServiceLink v1.0.5 (2)`.
 */
export function getAppVersionLine() {
  const version = getAppMarketingVersion();
  const build = getAppBuildNumber();
  if (build) {
    return `${APP_DISPLAY_NAME} v${version} (${build})`;
  }
  return `${APP_DISPLAY_NAME} v${version}`;
}
