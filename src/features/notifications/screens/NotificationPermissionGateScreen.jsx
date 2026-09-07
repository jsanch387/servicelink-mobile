import { useCallback, useState } from 'react';
import { useAuth } from '../../auth';
import { useNotificationPermissionPrimerGate } from '../context/NotificationPermissionPrimerGateContext';
import { requestPushPermissionAndRegister } from '../utils/registerPushDeviceToken';
import { NotificationPermissionScreen } from './NotificationPermissionScreen';

/**
 * First-run primer: Turn on presents the OS dialog, then continues into the app.
 */
export function NotificationPermissionGateScreen() {
  const { user } = useAuth();
  const { completePrimer } = useNotificationPermissionPrimerGate();
  const [enableLoading, setEnableLoading] = useState(false);

  const handleEnable = useCallback(async () => {
    if (enableLoading) {
      return;
    }
    setEnableLoading(true);
    try {
      await requestPushPermissionAndRegister(user?.id);
    } finally {
      await completePrimer();
      setEnableLoading(false);
    }
  }, [completePrimer, enableLoading, user?.id]);

  const handleSkip = useCallback(async () => {
    if (enableLoading) {
      return;
    }
    await completePrimer();
  }, [completePrimer, enableLoading]);

  return (
    <NotificationPermissionScreen
      enableLoading={enableLoading}
      onEnable={() => {
        void handleEnable();
      }}
      onSkip={() => {
        void handleSkip();
      }}
    />
  );
}
