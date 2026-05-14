import { useFocusEffect } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';

/**
 * Tracks device-level push permission and refreshes when the screen is focused or the app returns active.
 * @returns {{
 *   status: import('expo-notifications').PermissionStatus | 'unavailable' | null;
 *   loadError: string | null;
 *   isLoading: boolean;
 *   refresh: () => Promise<void>;
 *   requestPermission: () => Promise<import('expo-notifications').PermissionStatus>;
 * }}
 */
export function usePushNotificationPermission() {
  const [status, setStatus] = useState(
    /** @type {import('expo-notifications').PermissionStatus | 'unavailable' | null} */ (null),
  );
  const [loadError, setLoadError] = useState(/** @type {string | null} */ (null));

  const refresh = useCallback(async () => {
    if (Platform.OS === 'web') {
      setStatus('unavailable');
      setLoadError(null);
      return;
    }
    try {
      setLoadError(null);
      const { status: next } = await Notifications.getPermissionsAsync();
      setStatus(next);
    } catch {
      setLoadError('Could not read notification permission.');
      setStatus(null);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (Platform.OS === 'web') {
      return /** @type {const} */ ('denied');
    }
    try {
      setLoadError(null);
      const { status: next } = await Notifications.requestPermissionsAsync();
      setStatus(next);
      return next;
    } catch {
      setLoadError('Could not request notification permission.');
      return /** @type {const} */ ('denied');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') {
        void refresh();
      }
    });
    return () => sub.remove();
  }, [refresh]);

  return {
    status,
    loadError,
    isLoading: status === null && loadError === null,
    refresh,
    requestPermission,
  };
}
