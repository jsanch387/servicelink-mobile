import * as Notifications from 'expo-notifications';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { useAuth } from '../../auth';
import { useOnboardingGate } from '../../onboarding';
import {
  hasSeenNotificationPermissionPrimer,
  markNotificationPermissionPrimerSeen,
} from '../storage/notificationPermissionPrimerStorage';
import { shouldShowNotificationPermissionPrimer } from '../utils/shouldShowNotificationPermissionPrimer';

const NotificationPermissionPrimerGateContext = createContext(null);

/**
 * After sign-in and onboarding, show the primer once while OS permission is still undetermined.
 */
export function NotificationPermissionPrimerGateProvider({ children }) {
  const { session, user } = useAuth();
  const { needsOnboarding, isGateReady } = useOnboardingGate();
  const userId = user?.id ?? null;
  const eligible = Boolean(session && userId && isGateReady && !needsOnboarding);

  const [hasSeenPrimer, setHasSeenPrimer] = useState(/** @type {boolean | null} */ (null));
  const [permissionStatus, setPermissionStatus] = useState(/** @type {string | null} */ (null));

  useEffect(() => {
    if (!eligible) {
      setHasSeenPrimer(null);
      setPermissionStatus(null);
      return undefined;
    }

    let cancelled = false;
    void (async () => {
      const seen = await hasSeenNotificationPermissionPrimer(userId);
      let status = 'unavailable';
      if (Platform.OS !== 'web') {
        try {
          const current = await Notifications.getPermissionsAsync();
          status = current.status;
        } catch {
          status = 'unavailable';
        }
      }
      if (!cancelled) {
        setHasSeenPrimer(seen);
        setPermissionStatus(status);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [eligible, userId]);

  const isPrimerReady = !eligible || (hasSeenPrimer !== null && permissionStatus !== null);
  const needsPrimer =
    eligible &&
    isPrimerReady &&
    shouldShowNotificationPermissionPrimer({
      platform: Platform.OS,
      permissionStatus,
      hasSeenPrimer: Boolean(hasSeenPrimer),
    });

  const completePrimer = useCallback(async () => {
    await markNotificationPermissionPrimerSeen(userId);
    setHasSeenPrimer(true);
  }, [userId]);

  const value = useMemo(
    () => ({
      needsPrimer,
      isPrimerReady,
      completePrimer,
    }),
    [completePrimer, isPrimerReady, needsPrimer],
  );

  return (
    <NotificationPermissionPrimerGateContext.Provider value={value}>
      {children}
    </NotificationPermissionPrimerGateContext.Provider>
  );
}

export function useNotificationPermissionPrimerGate() {
  const ctx = useContext(NotificationPermissionPrimerGateContext);
  if (!ctx) {
    throw new Error(
      'useNotificationPermissionPrimerGate must be used within NotificationPermissionPrimerGateProvider',
    );
  }
  return ctx;
}
