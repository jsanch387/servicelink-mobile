import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
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
import { warmTapToPayReader } from '../terminal/tapToPayTerminalConnect';
import {
  isTapToPayReaderWarm,
  resetTapToPayTerminalSession,
} from '../terminal/tapToPayTerminalSession';
import { maybePresentTapToPayEducationAfterConnect } from '../education/maybePresentTapToPayEducationAfterConnect';
import { logTapToPayDebug, logTapToPayFailure, maskId } from '../utils/logTapToPayDebug';
import { useTapToPayConnectReadiness } from './useTapToPayConnectReadiness';

/**
 * Silently initializes Stripe Terminal and connects Tap to Pay when the user is
 * already signed in (app cold start or return to foreground). No UI — collection
 * reuses the warm reader when the payment sheet opens.
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
  const warmupInFlightRef = useRef(false);
  const lastWarmupKeyRef = useRef(null);
  const warmupBookingIdRef = useRef(null);
  const warmupUnavailableRef = useRef(false);

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

  const runWarmup = useCallback(async () => {
    if (!canWarm || !accessToken || !terminalLocationId?.trim() || !stripeAccountId?.trim()) {
      return;
    }

    if (warmupUnavailableRef.current) {
      return;
    }

    const warmupKey = `${terminalLocationId.trim()}|${stripeAccountId.trim()}`;
    if (warmupInFlightRef.current) {
      return;
    }
    if (lastWarmupKeyRef.current === warmupKey && isTapToPayReaderWarm()) {
      logTapToPayDebug('warmup.skip', { reason: 'already_warm', warmupKey: maskId(warmupKey) });
      void maybePresentTapToPayEducationAfterConnect();
      return;
    }

    warmupInFlightRef.current = true;
    try {
      await warmTapToPayReader({
        initialize: terminal.initialize,
        supportsReadersOfType: terminal.supportsReadersOfType,
        easyConnect: terminal.easyConnect,
        disconnectReader: terminal.disconnectReader,
        clearCachedCredentials: terminal.clearCachedCredentials,
        getLocations: terminal.getLocations,
        connectParams: {
          terminalLocationId: terminalLocationId.trim(),
          stripeAccountId: stripeAccountId.trim(),
        },
        merchantDisplayName,
      });
      lastWarmupKeyRef.current = warmupKey;
      warmupUnavailableRef.current = false;
      await maybePresentTapToPayEducationAfterConnect();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Warm-up failed';
      warmupUnavailableRef.current = true;
      logTapToPayDebug('warmup.failed', { message });
    } finally {
      warmupInFlightRef.current = false;
    }
  }, [
    accessToken,
    canWarm,
    merchantDisplayName,
    stripeAccountId,
    terminal.clearCachedCredentials,
    terminal.disconnectReader,
    terminal.easyConnect,
    terminal.getLocations,
    terminal.initialize,
    terminal.supportsReadersOfType,
    terminalLocationId,
  ]);

  useEffect(() => {
    if (!accessToken) {
      resetTapToPayTerminalSession();
      lastWarmupKeyRef.current = null;
      warmupBookingIdRef.current = null;
      warmupUnavailableRef.current = false;
      return;
    }
    if (!isLoading && canWarm) {
      void runWarmup();
    }
  }, [accessToken, canWarm, isLoading, runWarmup]);

  useEffect(() => {
    if (!canWarm) {
      return undefined;
    }
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active' && !isTapToPayReaderWarm()) {
        warmupUnavailableRef.current = false;
        void runWarmup();
      }
    });
    return () => sub.remove();
  }, [canWarm, runWarmup]);
}
