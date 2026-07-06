import { useStripeTerminal } from '@stripe/stripe-terminal-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../../auth';
import { provisionTapToPayMerchantSetup } from '../api/provisionTapToPayMerchantSetup';
import { TAP_TO_PAY_ENABLE_FAILED } from '../constants/tapToPayEnableCopy';
import { TAP_TO_PAY_USE_TERMINAL_SDK } from '../constants/tapToPayFeatureFlags';
import { warmTapToPayReader } from '../terminal/tapToPayTerminalConnect';
import {
  getTapToPayTerminalSessionSnapshot,
  isTapToPayReaderWarm,
} from '../terminal/tapToPayTerminalSession';
import {
  logTapToPayDebug,
  logTapToPayFailure,
  logTapToPayInfo,
  maskId,
} from '../utils/logTapToPayDebug';
import {
  buildTapToPayMerchantEnablementKey,
  isTapToPayMerchantEnabled,
  markTapToPayMerchantEnabled,
} from '../utils/tapToPayEnablementStorage';
import { useTapToPayConnectReadiness } from './useTapToPayConnectReadiness';

function resolveCanEnableBlockReason({ useTerminalSdk, isConnectReady, stripeAccountId }) {
  if (!useTerminalSdk) {
    return 'terminal_sdk_off';
  }
  if (!isConnectReady) {
    return 'stripe_connect_not_ready';
  }
  if (!stripeAccountId?.trim()) {
    return 'missing_stripe_account_id';
  }
  return null;
}

/**
 * Explicit Tap to Pay enablement on Payments (Apple 3.6). Same connect + Apple T&C
 * flow as checkout; provisions terminal location on the server when missing.
 *
 * UI state splits merchant opt-in (AsyncStorage) from reader readiness (live connect).
 */
export function useTapToPayEnablement() {
  const { session } = useAuth();
  const accessToken = session?.access_token ?? null;
  const {
    isConnectReady,
    isLoading,
    merchantDisplayName,
    terminalLocationId,
    stripeAccountId,
    refetch,
  } = useTapToPayConnectReadiness();
  const terminal = useStripeTerminal();
  const terminalRef = useRef(terminal);
  terminalRef.current = terminal;

  const [isOptedIn, setIsOptedIn] = useState(false);
  const [isReaderReady, setIsReaderReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [isEnabling, setIsEnabling] = useState(false);

  const canEnable =
    TAP_TO_PAY_USE_TERMINAL_SDK && isConnectReady && Boolean(stripeAccountId?.trim());

  const needsReconnect = isOptedIn && !isReaderReady;
  /** Payments card — merchant opted in on this device (AsyncStorage), not live reader session. */
  const isEnabled = isOptedIn;

  const refresh = useCallback(
    async (reason = 'unknown') => {
      const sessionSnapshot = getTapToPayTerminalSessionSnapshot();
      const expectedMerchantKey = buildTapToPayMerchantEnablementKey(
        stripeAccountId,
        terminalLocationId,
      );
      const blockReason = resolveCanEnableBlockReason({
        useTerminalSdk: TAP_TO_PAY_USE_TERMINAL_SDK,
        isConnectReady,
        stripeAccountId,
      });
      const hasTerminalLocation = Boolean(terminalLocationId?.trim());

      logTapToPayDebug('enablement.refresh.start', {
        reason,
        canEnable,
        blockReason: blockReason ?? '(none)',
        hasTerminalLocation,
        isConnectReady,
        isLoading,
        stripeAccountId: maskId(stripeAccountId),
        terminalLocationId: maskId(terminalLocationId),
        expectedMerchantKey: expectedMerchantKey ? maskId(expectedMerchantKey) : '(missing ids)',
        readerWarm: sessionSnapshot.isReaderWarm,
        sessionInitialized: sessionSnapshot.initialized,
        sessionReaderWarm: sessionSnapshot.readerWarm,
        sessionConnectKey: sessionSnapshot.lastConnectKey
          ? maskId(sessionSnapshot.lastConnectKey)
          : '(none)',
      });

      if (!canEnable) {
        logTapToPayDebug('enablement.refresh.blocked', {
          reason,
          blockReason,
          note: 'Payments card hides Enable CTA when canEnable is false',
        });
        setIsOptedIn(false);
        setIsReaderReady(false);
        setChecking(false);
        return;
      }

      setChecking(true);
      try {
        const stored = hasTerminalLocation
          ? await isTapToPayMerchantEnabled(stripeAccountId, terminalLocationId)
          : false;
        const readerWarm = isTapToPayReaderWarm();
        setIsOptedIn(stored);
        setIsReaderReady(readerWarm);
        logTapToPayDebug('enablement.refresh.ok', {
          reason,
          storedMerchantEnabled: stored,
          readerWarm,
          isOptedIn: stored,
          isReaderReady: readerWarm,
          needsReconnect: stored && !readerWarm,
          showEnableCta: !stored,
          showEnabledPill: stored,
          note:
            stored && !readerWarm
              ? 'opted in — Enabled pill shown; reader connects on Enable tap or Collect'
              : undefined,
        });
      } finally {
        setChecking(false);
      }
    },
    [canEnable, isConnectReady, isLoading, stripeAccountId, terminalLocationId],
  );

  useEffect(() => {
    void refresh('hook_mount');
  }, [refresh]);

  const enable = useCallback(async () => {
    if (!canEnable || isEnabling) {
      logTapToPayDebug('enable.start.skipped', {
        canEnable,
        isEnabling,
      });
      return false;
    }

    if (isOptedIn && isTapToPayReaderWarm()) {
      logTapToPayDebug('enable.start.skipped', {
        reason: 'already_opted_in_and_reader_warm',
      });
      await refresh('enable_already_ready');
      return true;
    }

    const accountId = stripeAccountId?.trim() ?? '';
    if (!accountId || !accessToken) {
      return false;
    }

    setIsEnabling(true);

    try {
      let locationId = terminalLocationId?.trim() ?? '';

      if (!locationId) {
        logTapToPayDebug('enable.provision.required', { stripeAccountId: maskId(accountId) });
        const provision = await provisionTapToPayMerchantSetup({
          accessToken,
          stripeAccountId: accountId,
          refetchPayments: refetch,
        });
        if (!provision.ok) {
          throw provision.error;
        }
        locationId = provision.terminalLocationId?.trim() ?? '';
        logTapToPayDebug('enable.provision.done', {
          terminalLocationId: locationId ? maskId(locationId) : '(will resolve via Stripe SDK)',
        });
      }

      logTapToPayDebug('enable.start', {
        terminalLocationId: locationId ? maskId(locationId) : '(sdk_resolve)',
        stripeAccountId: maskId(accountId),
        reconnect: isOptedIn && !isReaderReady,
      });

      const activeTerminal = terminalRef.current;
      await warmTapToPayReader({
        initialize: activeTerminal.initialize,
        supportsReadersOfType: activeTerminal.supportsReadersOfType,
        easyConnect: activeTerminal.easyConnect,
        disconnectReader: activeTerminal.disconnectReader,
        clearCachedCredentials: activeTerminal.clearCachedCredentials,
        getLocations: activeTerminal.getLocations,
        connectParams: {
          terminalLocationId: locationId || null,
          stripeAccountId: accountId,
        },
        merchantDisplayName,
        reason: isOptedIn && !isReaderReady ? 'reconnect' : 'enable',
      });

      const sessionAfterConnect = getTapToPayTerminalSessionSnapshot();
      let resolvedLocationId = locationId;
      if (!resolvedLocationId && sessionAfterConnect.lastConnectKey) {
        resolvedLocationId = sessionAfterConnect.lastConnectKey.split('|')[0]?.trim() ?? '';
      }

      if (resolvedLocationId) {
        await markTapToPayMerchantEnabled(accountId, resolvedLocationId);
      } else {
        logTapToPayDebug('enable.mark.skipped', {
          note: 'connected but could not resolve terminal location id for storage',
        });
      }

      await refresh('enable_ok');
      logTapToPayInfo('enable.ok', { stripeAccountId: maskId(accountId) });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : TAP_TO_PAY_ENABLE_FAILED;
      logTapToPayFailure('enable', { message });
      Alert.alert('Tap to Pay', message.trim() || TAP_TO_PAY_ENABLE_FAILED);
      return false;
    } finally {
      setIsEnabling(false);
    }
  }, [
    accessToken,
    canEnable,
    isEnabling,
    isOptedIn,
    isReaderReady,
    merchantDisplayName,
    refetch,
    refresh,
    stripeAccountId,
    terminalLocationId,
  ]);

  return {
    canEnable,
    isEnabled,
    isOptedIn,
    isReaderReady,
    needsReconnect,
    checking: checking || isLoading,
    isEnabling,
    enable,
    refresh,
  };
}
