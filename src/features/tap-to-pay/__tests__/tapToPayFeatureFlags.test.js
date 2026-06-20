import { Platform } from 'react-native';

import {
  isTapToPayPlatformSupported,
  isTapToPayUiEnabled,
} from '../constants/tapToPayFeatureFlags';

describe('tapToPayFeatureFlags', () => {
  const originalOs = Platform.OS;

  afterEach(() => {
    Platform.OS = originalOs;
  });

  it('isTapToPayPlatformSupported is true on iOS only', () => {
    Platform.OS = 'ios';
    expect(isTapToPayPlatformSupported()).toBe(true);

    Platform.OS = 'android';
    expect(isTapToPayPlatformSupported()).toBe(false);
  });

  it('isTapToPayUiEnabled is false on Android even when server APIs and SDK are on', () => {
    Platform.OS = 'android';
    expect(isTapToPayUiEnabled()).toBe(false);
  });

  it('isTapToPayUiEnabled is true on iOS when server APIs and SDK are on', () => {
    Platform.OS = 'ios';
    expect(isTapToPayUiEnabled()).toBe(true);
  });
});
