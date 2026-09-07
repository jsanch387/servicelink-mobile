import { useCallback, useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { useAuth } from '../../auth';
import { registerPushDeviceTokenIfGranted } from '../utils/registerPushDeviceToken';

/**
 * Registers the Expo push token after sign-in when permission is already granted.
 * Does not present the system prompt — that happens from the first-run primer or Settings.
 */
export function PushTokenRegistration() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const tryRegister = useCallback(async () => {
    if (Platform.OS === 'web' || !userId) {
      return;
    }
    await registerPushDeviceTokenIfGranted(userId);
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
