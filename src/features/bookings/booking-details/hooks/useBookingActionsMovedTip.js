import { useCallback, useEffect, useState } from 'react';
import {
  hasSeenBookingActionsMovedTip,
  markBookingActionsMovedTipSeen,
} from '../storage/bookingActionsMovedTipStorage';

/**
 * Nudge after actions moved into the header ⋯ menu.
 * Shown once per device, then stored so it does not come back.
 *
 * @param {{ enabled?: boolean }} args
 */
export function useBookingActionsMovedTip({ enabled = false }) {
  const [alreadySeen, setAlreadySeen] = useState(true);
  const [ready, setReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }
    let cancelled = false;
    void hasSeenBookingActionsMovedTip().then((value) => {
      if (cancelled) {
        return;
      }
      setAlreadySeen(value);
      setDismissed(false);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const visible = Boolean(enabled && ready && !alreadySeen && !dismissed);

  useEffect(() => {
    if (!visible) {
      return;
    }
    void markBookingActionsMovedTipSeen();
  }, [visible]);

  const dismiss = useCallback(() => {
    setDismissed(true);
    void markBookingActionsMovedTipSeen();
  }, []);

  return { visible, dismiss, ready };
}
