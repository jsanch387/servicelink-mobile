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

jest.mock('@stripe/stripe-terminal-react-native', () => ({
  StripeTerminalProvider: ({ children }) => children,
  useStripeTerminal: () => ({
    initialize: jest.fn(async () => ({ error: undefined })),
    supportsReadersOfType: jest.fn(async () => ({ readerSupportResult: true, error: undefined })),
    easyConnect: jest.fn(async () => ({ reader: { id: 'reader-1' }, error: undefined })),
    disconnectReader: jest.fn(async () => ({ error: undefined })),
    clearCachedCredentials: jest.fn(async () => ({ error: undefined })),
    getLocations: jest.fn(async () => ({ locations: [{ id: 'tml_test' }], error: undefined })),
    retrievePaymentIntent: jest.fn(async () => ({
      paymentIntent: {
        id: 'pi_test',
        amount: 5000,
        status: 'requires_payment_method',
        sdkUuid: 'uuid',
      },
      error: undefined,
    })),
    processPaymentIntent: jest.fn(async () => ({
      paymentIntent: { id: 'pi_test', amount: 5000, status: 'succeeded' },
      error: undefined,
    })),
  }),
}));

jest.mock('servicelink-tap-to-pay-education', () => ({
  isTapToPayEducationNativeAvailable: jest.fn(() => false),
  isTapToPayEducationNativeModuleLinked: jest.fn(() => false),
  presentTapToPayEducationNative: jest.fn(() => Promise.resolve()),
}));

jest.mock('./src/features/tap-to-pay/utils/logTapToPayDebug', () => {
  const actual = jest.requireActual('./src/features/tap-to-pay/utils/logTapToPayDebug');
  return {
    ...actual,
    logTapToPayDebug: jest.fn(),
    logTapToPayFailure: jest.fn(),
  };
});
