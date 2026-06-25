import { useCallback, useEffect, useRef } from 'react';
import { useStripeTerminal } from '@stripe/stripe-terminal-react-native';
import { useAuth } from '../../auth';
import { fetchTapToPayWarmupConnectionToken } from '../api/fetchTapToPayWarmupConnectionToken';
import {
  TAP_TO_PAY_USE_TERMINAL_SDK,
  isTapToPayPlatformSupported,
} from '../constants/tapToPayFeatureFlags';
import {
  clearMerchantTapToPayConnectionTokenFetcher,
  setMerchantTapToPayConnectionTokenFetcher,
} from '../terminal/tapToPayConnectionTokenRegistry';
import { prewarmTapToPayReaderSession } from '../terminal/tapToPayTerminalConnect';
import {
  isTapToPayReaderWarm,
  resetTapToPayTerminalSession,
} from '../terminal/tapToPayTerminalSession';
import { isTapToPayMerchantEnabled } from '../utils/tapToPayEnablementStorage';
import { logTapToPayDebug, logTapToPayFailure, maskId } from '../utils/logTapToPayDebug';
import { useTapToPayConnectReadiness } from './useTapToPayConnectReadiness';

function resolveWarmupBlockReason({
  platformSupported,
  useTerminalSdk,
  accessToken,
  isConnectReady,
  terminalLocationId,
  stripeAccountId,
}) {
  if (!platformSupported) {
    return 'platform_unsupported';
  }
  if (!useTerminalSdk) {
    return 'terminal_sdk_off';
  }
  if (!accessToken) {
    return 'no_session';
  }
  if (!isConnectReady) {
    return 'stripe_connect_not_ready';
  }
  if (!terminalLocationId?.trim()) {
    return 'missing_terminal_location_id';
  }
  if (!stripeAccountId?.trim()) {
    return 'missing_stripe_account_id';
  }
  return null;
}

/**
 * Silent Tap to Pay prep after merchant opt-in: registers connection-token fetcher,
 * initializes Terminal SDK, and connects the reader in the background (no Apple T&C if
 * already accepted on Enable).
 */
export function useTapToPayWarmup() {
  const { session } = useAuth();
  const accessToken = session?.access_token ?? null;
  const {
    businessId,
    isConnectReady,
    isLoading,
    merchantDisplayName,
    terminalLocationId,
    stripeAccountId,
  } = useTapToPayConnectReadiness();

  const terminal = useStripeTerminal();
  const terminalRef = useRef(terminal);
  terminalRef.current = terminal;
  const prepareInFlightRef = useRef(false);
  const warmupBookingIdRef = useRef(null);

  const canWarm =
    isTapToPayPlatformSupported() &&
    TAP_TO_PAY_USE_TERMINAL_SDK &&
    Boolean(accessToken) &&
    isConnectReady &&
    Boolean(terminalLocationId?.trim()) &&
    Boolean(stripeAccountId?.trim());

  useEffect(() => {
    if (!canWarm || !accessToken || !stripeAccountId) {
      clearMerchantTapToPayConnectionTokenFetcher();
      return undefined;
    }

    const resolvedStripeAccountId = stripeAccountId.trim();
    setMerchantTapToPayConnectionTokenFetcher(async () => {
      try {
        return await fetchTapToPayWarmupConnectionToken({
          accessToken,
          stripeAccountId: resolvedStripeAccountId,
          businessId,
          warmupBookingIdRef,
        });
      } catch (err) {
        logTapToPayFailure('connection-token', {
          scope: 'merchant',
          message: err instanceof Error ? err.message : 'Connection token failed',
        });
        throw err;
      }
    });

    return () => {
      clearMerchantTapToPayConnectionTokenFetcher();
    };
  }, [accessToken, businessId, canWarm, stripeAccountId]);

  const runSilentPrepare = useCallback(async () => {
    if (!canWarm || !accessToken || !terminalLocationId?.trim() || !stripeAccountId?.trim()) {
      return;
    }

    const prepareKey = `${terminalLocationId.trim()}|${stripeAccountId.trim()}`;
    if (prepareInFlightRef.current) {
      return;
    }

    const merchantEnabled = await isTapToPayMerchantEnabled(stripeAccountId, terminalLocationId);
    if (!merchantEnabled) {
      logTapToPayDebug('warmup.skip', { reason: 'not_enabled', warmupKey: maskId(prepareKey) });
      return;
    }

    if (isTapToPayReaderWarm()) {
      logTapToPayDebug('warmup.skip', {
        reason: 'reader_already_warm',
        warmupKey: maskId(prepareKey),
      });
      return;
    }

    prepareInFlightRef.current = true;
    const activeTerminal = terminalRef.current;
    try {
      await prewarmTapToPayReaderSession({
        initialize: activeTerminal.initialize,
        supportsReadersOfType: activeTerminal.supportsReadersOfType,
        easyConnect: activeTerminal.easyConnect,
        disconnectReader: activeTerminal.disconnectReader,
        clearCachedCredentials: activeTerminal.clearCachedCredentials,
        getLocations: activeTerminal.getLocations,
        connectParams: {
          terminalLocationId: terminalLocationId.trim(),
          stripeAccountId: stripeAccountId.trim(),
        },
        merchantDisplayName,
        reason: 'warmup',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Warm-up failed';
      logTapToPayDebug('warmup.failed', { message });
    } finally {
      prepareInFlightRef.current = false;
    }
  }, [accessToken, canWarm, merchantDisplayName, stripeAccountId, terminalLocationId]);

  useEffect(() => {
    if (!accessToken) {
      resetTapToPayTerminalSession();
      warmupBookingIdRef.current = null;
      return;
    }
    if (isLoading) {
      return;
    }

    if (!canWarm) {
      logTapToPayDebug('warmup.gated', {
        blockReason: resolveWarmupBlockReason({
          platformSupported: isTapToPayPlatformSupported(),
          useTerminalSdk: TAP_TO_PAY_USE_TERMINAL_SDK,
          accessToken,
          isConnectReady,
          terminalLocationId,
          stripeAccountId,
        }),
        note: 'silent prepare runs after gates pass and merchant enabled flag is set',
      });
      return;
    }

    void runSilentPrepare();
  }, [
    accessToken,
    canWarm,
    isConnectReady,
    isLoading,
    runSilentPrepare,
    stripeAccountId,
    terminalLocationId,
  ]);
}
