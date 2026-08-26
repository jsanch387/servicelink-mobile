import { useCallback, useEffect, useState } from 'react';
import { DeviceEventEmitter } from 'react-native';
import {
  markCreatePaymentHighlightSeen,
  readCreatePaymentHighlightSeen,
} from '../storage/createPaymentHighlightStorage';

export const CREATE_PAYMENT_HIGHLIGHT_DEV_RESET_EVENT =
  'servicelink.createPayment.fabHighlight.devReset';

/**
 * FAB glow + Create payment “New” treatment — once per device.
 *
 * @param {{ enabled?: boolean }} args
 */
export function useCreatePaymentHighlight({ enabled = false } = {}) {
  const [seen, setSeen] = useState(true);
  const [ready, setReady] = useState(false);
  const [sessionDone, setSessionDone] = useState(false);

  const refresh = useCallback(async () => {
    const value = await readCreatePaymentHighlightSeen();
    setSeen(value);
    setSessionDone(false);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setReady(true);
      setSeen(true);
      return undefined;
    }
    let cancelled = false;
    void readCreatePaymentHighlightSeen().then((value) => {
      if (cancelled) {
        return;
      }
      setSeen(value);
      setSessionDone(false);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  useEffect(() => {
    if (typeof __DEV__ === 'undefined' || !__DEV__) {
      return undefined;
    }
    const sub = DeviceEventEmitter.addListener(CREATE_PAYMENT_HIGHLIGHT_DEV_RESET_EVENT, () => {
      void refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  const markSeen = useCallback(async () => {
    setSessionDone(true);
    setSeen(true);
    await markCreatePaymentHighlightSeen();
  }, []);

  return {
    showHighlight: enabled && ready && !seen && !sessionDone,
    markSeen,
    ready,
  };
}
