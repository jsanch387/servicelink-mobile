import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { getAppBuildNumber, getAppMarketingVersion } from '../../../constants/appInfo';
import {
  getTapToPayTerminalSessionSnapshot,
  isTapToPayReaderWarm,
} from '../terminal/tapToPayTerminalSession';

/**
 * Stable device/app context for Tap to Pay failure reports (no PII).
 * Helps answer: old build? unsupported OS? reader session stale?
 *
 * @returns {Record<string, string | number | boolean | null>}
 */
export function getTapToPayClientDiagnostics() {
  const session = getTapToPayTerminalSessionSnapshot();
  const deviceName =
    Constants.deviceName ??
    Constants.expoConfig?.ios?.deviceName ??
    Constants.platform?.ios?.model ??
    null;

  return {
    platform: Platform.OS,
    osVersion: String(Platform.Version ?? ''),
    appVersion: getAppMarketingVersion(),
    appBuild: getAppBuildNumber(),
    deviceName: deviceName ? String(deviceName) : null,
    isDevice: Constants.isDevice !== false,
    readerWarm: isTapToPayReaderWarm(),
    sessionInitialized: session.initialized,
    sessionHasConnectKey: session.hasConnectKey,
  };
}
