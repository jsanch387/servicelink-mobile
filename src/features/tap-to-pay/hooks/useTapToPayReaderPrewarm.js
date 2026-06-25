import { useStripeTerminal } from '@stripe/stripe-terminal-react-native';
import { useEffect, useRef } from 'react';
import { TAP_TO_PAY_USE_TERMINAL_SDK } from '../constants/tapToPayFeatureFlags';
import { prewarmTapToPayReaderSession } from '../terminal/tapToPayTerminalConnect';
import { isTapToPayReaderWarm } from '../terminal/tapToPayTerminalSession';
import { logTapToPayDebug } from '../utils/logTapToPayDebug';
import { isTapToPayMerchantEnabled } from '../utils/tapToPayEnablementStorage';

/** @typedef {import('../utils/parseTapToPayIntentConnectParams').TapToPayConnectParams} TapToPayConnectParams */

/**
 * Background reader connect while the merchant is on Complete (or another checkout surface).
 * Only runs for merchants who already opted in — avoids Apple T&C during setup.
 *
 * @param {{
 *   enabled: boolean;
 *   connectParams: TapToPayConnectParams | null | undefined;
 *   merchantDisplayName?: string | null;
 *   reason?: string;
 * }} options
 */
export function useTapToPayReaderPrewarm({
  enabled,
  connectParams,
  merchantDisplayName = null,
  reason = 'complete_prewarm',
}) {
  const terminal = useStripeTerminal();
  const terminalRef = useRef(terminal);
  terminalRef.current = terminal;
  const inFlightRef = useRef(false);

  const locationId = connectParams?.terminalLocationId?.trim() ?? '';
  const stripeAccountId = connectParams?.stripeAccountId?.trim() ?? '';

  useEffect(() => {
    if (!enabled || !TAP_TO_PAY_USE_TERMINAL_SDK || !locationId || !stripeAccountId) {
      return undefined;
    }
    if (isTapToPayReaderWarm() || inFlightRef.current) {
      return undefined;
    }

    let cancelled = false;
    inFlightRef.current = true;

    void (async () => {
      try {
        const optedIn = await isTapToPayMerchantEnabled(stripeAccountId, locationId);
        if (cancelled || !optedIn) {
          if (!optedIn) {
            logTapToPayDebug('prewarm.skip', { reason: 'not_opted_in', scope: reason });
          }
          return;
        }
        if (isTapToPayReaderWarm()) {
          return;
        }

        logTapToPayDebug('prewarm.start', { scope: reason });
        const activeTerminal = terminalRef.current;
        await prewarmTapToPayReaderSession({
          initialize: activeTerminal.initialize,
          supportsReadersOfType: activeTerminal.supportsReadersOfType,
          easyConnect: activeTerminal.easyConnect,
          disconnectReader: activeTerminal.disconnectReader,
          clearCachedCredentials: activeTerminal.clearCachedCredentials,
          getLocations: activeTerminal.getLocations,
          connectParams: { terminalLocationId: locationId, stripeAccountId },
          merchantDisplayName,
          reason,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Prewarm failed';
        logTapToPayDebug('prewarm.failed', { scope: reason, message });
      } finally {
        inFlightRef.current = false;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, locationId, merchantDisplayName, reason, stripeAccountId]);
}
