import * as Notifications from 'expo-notifications';
import { useCallback, useEffect } from 'react';
import { useAuth } from '../../auth';
import { useOnboardingGate } from '../../onboarding';
import { useSubscription } from '../../subscription';
import { attemptPushNavigation } from '../utils/attemptPushNavigation';

function handleNotificationResponse(response, canNavigateMain) {
  const data = response?.notification?.request?.content?.data;
  attemptPushNavigation(data, { canNavigateMain });
}

/** Subscribes to notification opens and maps `data` to navigation (same targets as inbox). */
export function PushNotificationsBootstrap() {
  const { session, user } = useAuth();
  const { needsOnboarding } = useOnboardingGate();
  const { isLoading: subscriptionLoading } = useSubscription();

  const canNavigateMain = Boolean(session && user?.id && !needsOnboarding && !subscriptionLoading);

  const onNotificationResponse = useCallback(
    (response) => {
      handleNotificationResponse(response, canNavigateMain);
    },
    [canNavigateMain],
  );

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(onNotificationResponse);

    let active = true;
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!active || !response) {
        return;
      }
      onNotificationResponse(response);
    });

    return () => {
      active = false;
      sub.remove();
    };
  }, [onNotificationResponse]);

  return null;
}
