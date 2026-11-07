import { Platform } from 'react-native';

import {
  isTapToPayDevIntentPreviewEnabled,
  isTapToPayPlatformSupported,
  isTapToPayTipEnabledForEmail,
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

  it('turns testing mode on only in dev without the card reader', () => {
    expect(isTapToPayDevIntentPreviewEnabled(true, false)).toBe(true);
    expect(isTapToPayDevIntentPreviewEnabled(false, false)).toBe(false);
    expect(isTapToPayDevIntentPreviewEnabled(true, true)).toBe(false);
  });

  it('opens the tip sheet only for the preview email', () => {
    expect(isTapToPayTipEnabledForEmail('jesuss387@gmail.com')).toBe(true);
    expect(isTapToPayTipEnabledForEmail('Jesuss387@gmail.com')).toBe(true);
    expect(isTapToPayTipEnabledForEmail('owner@shop.com')).toBe(false);
    expect(isTapToPayTipEnabledForEmail('')).toBe(false);
  });

  it('isTapToPayUiEnabled is true on iOS when server APIs and SDK are on', () => {
    Platform.OS = 'ios';
    expect(isTapToPayUiEnabled()).toBe(true);
  });
});
