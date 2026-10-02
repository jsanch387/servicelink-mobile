jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      version: '1.0.6',
      extra: {
        minNativeAppVersion: '1.0.7',
        iosAppStoreUrl: 'https://apps.apple.com/app/id6768877250',
      },
    },
    nativeApplicationVersion: '1.0.6',
  },
}));

describe('getNativeStoreUpdateConfig', () => {
  beforeEach(() => {
    delete process.env.EXPO_PUBLIC_MIN_NATIVE_APP_VERSION;
  });

  it('requires update when current version is below minimum', () => {
    const { isNativeStoreUpdateRequired } = require('../getNativeStoreUpdateConfig');
    expect(isNativeStoreUpdateRequired()).toBe(true);
  });

  it('does not require update when current version matches minimum', () => {
    const { isNativeStoreUpdateRequired } = require('../getNativeStoreUpdateConfig');
    expect(isNativeStoreUpdateRequired('1.0.7', '1.0.7')).toBe(false);
  });

  it('does not require update when minimum is unset', () => {
    const { isNativeStoreUpdateRequired } = require('../getNativeStoreUpdateConfig');
    expect(isNativeStoreUpdateRequired('1.0.6', '')).toBe(false);
  });
});
