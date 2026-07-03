import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { getAppMarketingVersion } from '../../../constants/appInfo';
import { compareAppVersions } from './compareAppVersions';

const DEFAULT_IOS_APP_STORE_URL = 'https://apps.apple.com/app/id6768877250';
const DEFAULT_ANDROID_PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.myservicelink.app';

function readExtraString(key) {
  const value = Constants.expoConfig?.extra?.[key];
  return typeof value === 'string' ? value.trim() : '';
}

export function getMinNativeAppVersion() {
  return (
    String(process.env.EXPO_PUBLIC_MIN_NATIVE_APP_VERSION ?? '').trim() ||
    readExtraString('minNativeAppVersion')
  );
}

export function getNativeStoreUpdateUrl() {
  if (Platform.OS === 'ios') {
    return (
      String(process.env.EXPO_PUBLIC_IOS_APP_STORE_URL ?? '').trim() ||
      readExtraString('iosAppStoreUrl') ||
      DEFAULT_IOS_APP_STORE_URL
    );
  }

  if (Platform.OS === 'android') {
    return (
      String(process.env.EXPO_PUBLIC_ANDROID_PLAY_STORE_URL ?? '').trim() ||
      readExtraString('androidPlayStoreUrl') ||
      DEFAULT_ANDROID_PLAY_STORE_URL
    );
  }

  return null;
}

/** True when the installed App Store / Play binary is older than the configured minimum. */
export function isNativeStoreUpdateRequired(
  currentVersion = getAppMarketingVersion(),
  minimumVersion = getMinNativeAppVersion(),
) {
  if (!minimumVersion) {
    return false;
  }

  return compareAppVersions(currentVersion, minimumVersion) < 0;
}
