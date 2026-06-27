import { getAppBuildNumber, getAppMarketingVersion, getAppVersionLine } from '../appInfo';

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      version: '1.0.7',
      ios: { buildNumber: '17' },
      android: { versionCode: 17 },
    },
    nativeApplicationVersion: '1.0.7',
    nativeBuildVersion: '17',
  },
}));

describe('appInfo', () => {
  it('reads marketing version from expo config', () => {
    expect(getAppMarketingVersion()).toBe('1.0.7');
  });

  it('formats user-facing version line without build number', () => {
    expect(getAppVersionLine()).toBe('ServiceLink v1.0.7');
  });

  it('exposes build number helper', () => {
    expect(getAppBuildNumber()).toBeTruthy();
  });
});
