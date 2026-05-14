import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import { useAuth } from '../../auth';
import { upsertPushDeviceToken } from '../api/upsertPushDeviceToken';

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') {
    return;
  }
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Default',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

function resolveExpoProjectId() {
  return Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId ?? undefined;
}

/**
 * Registers for remote notifications after sign-in (main tabs) and saves the Expo token to Supabase.
 */
export function PushTokenRegistration() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const lastRegisteredToken = useRef(/** @type {string | null} */ (null));

  const tryRegister = useCallback(async () => {
    if (Platform.OS === 'web' || !userId) {
      return;
    }
    try {
      await ensureAndroidChannel();

      const { status: existing } = await Notifications.getPermissionsAsync();
      let nextStatus = existing;
      if (existing !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        nextStatus = status;
      }
      if (nextStatus !== 'granted') {
        return;
      }

      const projectId = resolveExpoProjectId();
      const tokenResult = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined,
      );
      const token = tokenResult.data;
      if (!token) {
        return;
      }

      if (lastRegisteredToken.current === token) {
        return;
      }
      lastRegisteredToken.current = token;

      await upsertPushDeviceToken(userId, token, Platform.OS === 'ios' ? 'ios' : 'android');
    } catch {
      // Simulator / Expo Go limits / missing EAS projectId / Supabase RLS — non-fatal.
    }
  }, [userId]);

  useEffect(() => {
    if (Platform.OS === 'web' || !userId) {
      return undefined;
    }
    void tryRegister();
    return undefined;
  }, [tryRegister, userId]);

  useEffect(() => {
    if (Platform.OS === 'web' || !userId) {
      return undefined;
    }
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') {
        void tryRegister();
      }
    });
    return () => sub.remove();
  }, [tryRegister, userId]);

  return null;
}
