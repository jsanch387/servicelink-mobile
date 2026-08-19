import { useNavigation } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { navigateNestedTabScreen } from '../../../navigation/navigateNestedTabScreen';
import { useSubscriptionsAccess } from '../../subscriptions/hooks/useSubscriptionsAccess';
import { useAppUpdateAnnouncement } from '../hooks/useAppUpdateAnnouncement';
import { WhatsNewModal } from './WhatsNewModal';

/**
 * Shows the next unseen feature announcement when main tabs are active.
 * Subscriptions launch (`subscriptions-v1`) only appears for owners with
 * subscriptions access (closed-testing allowlist, then Pro).
 */
export function AppUpdateAnnouncementsBootstrap() {
  const navigation = useNavigation();
  const subscriptionsAccess = useSubscriptionsAccess();
  const { announcement, hasAnnouncement, isReady, dismissCurrent } = useAppUpdateAnnouncement();
  const [actionBusy, setActionBusy] = useState(false);

  const isSubscriptionsAnnouncement = announcement?.id === 'subscriptions-v1';
  const canShowAnnouncement =
    hasAnnouncement &&
    (!isSubscriptionsAnnouncement ||
      (subscriptionsAccess.isReady && subscriptionsAccess.canUseSubscriptions));

  const handleDismiss = useCallback(async () => {
    await dismissCurrent();
  }, [dismissCurrent]);

  const handlePrimaryAction = useCallback(async () => {
    const cta = announcement?.cta;
    if (!cta) {
      await handleDismiss();
      return;
    }

    setActionBusy(true);
    try {
      await dismissCurrent();
      navigateNestedTabScreen(navigation, {
        tab: cta.tab,
        screen: cta.screen,
        params: cta.params,
      });
    } finally {
      setActionBusy(false);
    }
  }, [announcement?.cta, dismissCurrent, handleDismiss, navigation]);

  if (!isReady) {
    return null;
  }

  return (
    <WhatsNewModal
      announcement={announcement}
      primaryBusy={actionBusy}
      visible={canShowAnnouncement}
      onDismiss={handleDismiss}
      onPrimaryAction={announcement?.cta ? handlePrimaryAction : undefined}
    />
  );
}
