import '@testing-library/react-native';

const { act } = require('@testing-library/react-native');
const { notifyManager } = require('@tanstack/query-core');

/**
 * Query cache updates are scheduled on a microtask/setTimeout; without this, tests that
 * unmount before the flush can log "not wrapped in act(...)" (HookContainer / useSyncExternalStore).
 */
beforeAll(() => {
  notifyManager.setNotifyFunction((fn) => {
    act(() => {
      fn();
    });
  });
});

afterAll(() => {
  notifyManager.setNotifyFunction((fn) => {
    fn();
  });
});

process.env.EXPO_PUBLIC_SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'test-anon-key-for-jest';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('./src/theme/loadAppFonts', () => ({
  useLoadAppFonts: () => [true],
}));

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(() => Promise.resolve(true)),
  hideAsync: jest.fn(() => Promise.resolve()),
  hide: jest.fn(),
  setOptions: jest.fn(),
}));

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(() => Promise.resolve()),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'denied' })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'denied' })),
  getExpoPushTokenAsync: jest.fn(() => Promise.resolve({ data: 'ExponentPushToken[test]' })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  getLastNotificationResponseAsync: jest.fn(() => Promise.resolve(null)),
  AndroidImportance: { DEFAULT: 3 },
}));

jest.mock('./src/features/appUpdates/components/AppUpdateAnnouncementsBootstrap', () => ({
  AppUpdateAnnouncementsBootstrap: () => null,
}));
