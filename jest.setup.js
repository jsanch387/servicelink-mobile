import '@testing-library/react-native';
import { notifyManager } from '@tanstack/query-core';

/** Synchronous batches: avoids stray microtasks and act() noise from TanStack Query in Jest. */
notifyManager.setBatchNotifyFunction((fn) => {
  fn();
});

process.env.EXPO_PUBLIC_SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'test-anon-key-for-jest';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const Mock = (props) => <Text accessibilityRole="image" {...props} />;
  return new Proxy(
    {},
    {
      get() {
        return Mock;
      },
    },
  );
});

jest.mock('@expo/vector-icons/Ionicons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return function MockIonicons(props) {
    return <Text accessibilityRole="image" {...props} />;
  };
});

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});
