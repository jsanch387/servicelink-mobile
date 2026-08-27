import { useCallback, useEffect, useMemo, useState } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { ownerPaymentFailedNoticeEpisodeKey } from '../../more/utils/subscriptionPresentation';
import {
  markOwnerPaymentFailedNoticeDismissed,
  readDismissedOwnerPaymentFailedKeys,
} from '../storage/ownerPaymentFailedNoticeStorage';

export const OWNER_PAYMENT_FAILED_NOTICE_DEV_RESET_EVENT =
  'servicelink.subscription.paymentFailedNotice.devReset';

/**
 * Dismissible Home heads-up for a billed Pro owner whose payment failed.
 *
 * @param {{
 *   ownerProfile: Record<string, unknown> | null | undefined;
 *   enabled?: boolean;
 * }} args
 */
export function useOwnerSubscriptionPaymentFailedNotice({ ownerProfile, enabled = true }) {
  const episodeKey = useMemo(
    () => (enabled ? ownerPaymentFailedNoticeEpisodeKey(ownerProfile) : ''),
    [enabled, ownerProfile],
  );
  const [dismissedKeys, setDismissedKeys] = useState(/** @type {string[]} */ ([]));
  const [isReady, setIsReady] = useState(false);

  const refresh = useCallback(async () => {
    const keys = await readDismissedOwnerPaymentFailedKeys();
    setDismissedKeys(keys);
    setIsReady(true);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (typeof __DEV__ === 'undefined' || !__DEV__) {
      return undefined;
    }
    const sub = DeviceEventEmitter.addListener(OWNER_PAYMENT_FAILED_NOTICE_DEV_RESET_EVENT, () => {
      void refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  const visible = Boolean(isReady && episodeKey && !dismissedKeys.includes(episodeKey));

  const dismiss = useCallback(async () => {
    if (!episodeKey) {
      return;
    }
    await markOwnerPaymentFailedNoticeDismissed(episodeKey);
    setDismissedKeys((prev) => (prev.includes(episodeKey) ? prev : [...prev, episodeKey]));
  }, [episodeKey]);

  return {
    visible,
    isReady,
    dismiss,
  };
}
