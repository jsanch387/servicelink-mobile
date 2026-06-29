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

jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  select: (options) => options.ios,
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
    jest.resetModules();
    jest.doMock('expo-constants', () => ({
      __esModule: true,
      default: {
        expoConfig: {
          version: '1.0.7',
          extra: { minNativeAppVersion: '1.0.7' },
        },
        nativeApplicationVersion: '1.0.7',
      },
    }));
    const { isNativeStoreUpdateRequired } = require('../getNativeStoreUpdateConfig');
    expect(isNativeStoreUpdateRequired()).toBe(false);
  });

  it('does not require update when minimum is unset', () => {
    jest.resetModules();
    jest.doMock('expo-constants', () => ({
      __esModule: true,
      default: {
        expoConfig: { version: '1.0.6', extra: {} },
        nativeApplicationVersion: '1.0.6',
      },
    }));
    const { isNativeStoreUpdateRequired } = require('../getNativeStoreUpdateConfig');
    expect(isNativeStoreUpdateRequired()).toBe(false);
  });
});
