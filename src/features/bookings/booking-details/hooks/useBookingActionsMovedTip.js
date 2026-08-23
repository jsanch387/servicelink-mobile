import { useCallback, useState } from 'react';

/**
 * Nudge after actions moved into the header ⋯ menu.
 *
 * TESTING: always show when the actions menu is available. Restore
 * `bookingActionsMovedTipStorage` (seen once) before shipping.
 *
 * @param {{ enabled?: boolean }} args
 */
export function useBookingActionsMovedTip({ enabled = false }) {
  const [dismissed, setDismissed] = useState(false);

  const dismiss = useCallback(() => {
    setDismissed(true);
  }, []);

  return { visible: enabled && !dismissed, dismiss };
}
