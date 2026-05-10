import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { navigationRef } from '../../../navigation/navigationRef';
import { navigateFromPushPayload } from '../utils/navigateFromPushPayload';

function handleNotificationResponse(response) {
  const data = response?.notification?.request?.content?.data;
  if (!navigationRef.isReady()) {
    return;
  }
  navigateFromPushPayload(navigationRef, data);
}

/** Subscribes to notification opens and maps `data` to navigation (same targets as inbox). */
export function PushNotificationsBootstrap() {
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      handleNotificationResponse(response);
    });

    let active = true;
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!active || !response) {
        return;
      }
      handleNotificationResponse(response);
    });

    return () => {
      active = false;
      sub.remove();
    };
  }, []);

  return null;
}
