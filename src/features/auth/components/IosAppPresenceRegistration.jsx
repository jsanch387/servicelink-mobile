import { useCallback, useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import { markHasIosApp } from '../api/markHasIosApp';
import { useAuth } from '../context/AuthContext';

/**
 * After sign-in on iOS, sets `profiles.has_ios_app = true` (once per app session).
 */
export function IosAppPresenceRegistration() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const syncedRef = useRef(false);

  const tryMark = useCallback(async () => {
    if (Platform.OS !== 'ios' || !userId || syncedRef.current) {
      return;
    }
    try {
      await markHasIosApp(userId);
      syncedRef.current = true;
    } catch {
      // Offline / RLS / missing column — non-fatal; retries next foreground.
    }
  }, [userId]);

  useEffect(() => {
    if (Platform.OS !== 'ios' || !userId) {
      return undefined;
    }
    void tryMark();
    return undefined;
  }, [tryMark, userId]);

  useEffect(() => {
    if (Platform.OS !== 'ios' || !userId) {
      return undefined;
    }
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') {
        void tryMark();
      }
    });
    return () => sub.remove();
  }, [tryMark, userId]);

  return null;
}
