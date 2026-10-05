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

  it('uses the installed store version when an update bundle reports a newer version', () => {
    const Constants = require('expo-constants').default;
    const previousVersion = Constants.expoConfig.version;
    const previousNativeVersion = Constants.nativeApplicationVersion;
    const previousMinimum = Constants.expoConfig.extra.minNativeAppVersion;

    Constants.expoConfig.version = '1.0.12';
    Constants.nativeApplicationVersion = '1.0.6';
    Constants.expoConfig.extra.minNativeAppVersion = '1.0.12';

    const { isNativeStoreUpdateRequired } = require('../getNativeStoreUpdateConfig');
    expect(isNativeStoreUpdateRequired()).toBe(true);

    Constants.expoConfig.version = previousVersion;
    Constants.nativeApplicationVersion = previousNativeVersion;
    Constants.expoConfig.extra.minNativeAppVersion = previousMinimum;
  });
});
