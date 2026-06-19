import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { postTapToPayConnectionToken } from '../api/postTapToPayConnectionToken';
import { postTapToPayIntent } from '../api/postTapToPayIntent';
import {
  TAP_TO_PAY_DEV_MOCK_COLLECTION,
  TAP_TO_PAY_USE_SERVER_APIS,
  TAP_TO_PAY_USE_TERMINAL_SDK,
} from '../constants/tapToPayFeatureFlags';
import { TAP_TO_PAY_PENDING_MS, TAP_TO_PAY_SUCCESS_DISMISS_MS } from '../constants/tapToPayTimings';
import { collectTapToPayPaymentMock } from '../terminal/collectTapToPayPayment';
import {
  clearTapToPayConnectionTokenFetcher,
  setTapToPayConnectionTokenFetcher,
} from '../terminal/tapToPayConnectionTokenRegistry';
import { useTapToPayTerminalCollection } from './useTapToPayTerminalCollection';
import {
  fireTapToPayCollectStartHaptic,
  fireTapToPayErrorHaptic,
  fireTapToPayRetryHaptic,
  fireTapToPaySuccessHaptic,
} from '../utils/tapToPayHaptics';

/** @typedef {'loading_intent' | 'intent_error' | 'ready' | 'pending' | 'success' | 'error'} TapToPaySheetPhase */

/**
 * @param {number} amountDollars
 * @returns {number}
 */
function dollarsToCents(amountDollars) {
  const n = Number(amountDollars);
  if (!Number.isFinite(n)) {
    return 0;
  }
  return Math.round(n * 100);
}

/**
 * Loads Tap to Pay intent and runs Stripe Terminal collection when enabled.
 *
 * @param {{
 *   accessToken: string | null | undefined;
 *   bookingId: string | null | undefined;
 *   sessionFees: Array<{ label: string; amountCents: number }>;
 *   amountDueDollars: number;
 *   merchantDisplayName?: string | null;
 *   onSuccess: (result: { amountCents: number; paymentIntentId: string | null }) => void;
 *   onClose: () => void;
 *   runClose: (afterClose?: () => void) => void;
 * }} options
 */
export function useTapToPaySheet({
  accessToken,
  bookingId,
  sessionFees,
  amountDueDollars,
  merchantDisplayName = null,
  onSuccess,
  onClose,
  runClose,
}) {
  const { collectPayment } = useTapToPayTerminalCollection();
  const [phase, setPhase] = useState(/** @type {TapToPaySheetPhase} */ ('loading_intent'));
  const [intentError, setIntentError] = useState(/** @type {string | null} */ (null));
  const [amountCents, setAmountCents] = useState(0);
  const [paymentIntentId, setPaymentIntentId] = useState(/** @type {string | null} */ (null));
  const [clientSecret, setClientSecret] = useState(/** @type {string | null} */ (null));
  const [connectParams, setConnectParams] = useState(
    /** @type {import('../utils/parseTapToPayIntentConnectParams').TapToPayConnectParams | null} */ (
      null
    ),
  );
  const timersRef = useRef(/** @type {ReturnType<typeof setTimeout>[]} */ ([]));
  const sessionFeesKey = useMemo(() => JSON.stringify(sessionFees ?? []), [sessionFees]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const schedule = useCallback((fn, ms) => {
    const id = setTimeout(fn, ms);
    timersRef.current.push(id);
    return id;
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  useEffect(() => {
    if (!TAP_TO_PAY_USE_TERMINAL_SDK || !accessToken || !bookingId?.trim()) {
      clearTapToPayConnectionTokenFetcher();
      return undefined;
    }

    setTapToPayConnectionTokenFetcher(async () => {
      const tokenResult = await postTapToPayConnectionToken(accessToken, bookingId.trim());
      if (!tokenResult.ok) {
        throw tokenResult.error;
      }
      return tokenResult.secret;
    });

    return () => {
      clearTapToPayConnectionTokenFetcher();
    };
  }, [accessToken, bookingId]);

  const loadIntent = useCallback(async () => {
    if (!TAP_TO_PAY_USE_SERVER_APIS) {
      const cents = dollarsToCents(amountDueDollars);
      setAmountCents(cents);
      setPaymentIntentId(null);
      setClientSecret(null);
      setConnectParams(null);
      setIntentError(null);
      setPhase(cents > 0 ? 'ready' : 'intent_error');
      if (cents <= 0) {
        setIntentError('Nothing to collect.');
      }
      return;
    }

    if (!accessToken || !bookingId?.trim()) {
      setIntentError('Sign in again to collect payment.');
      setPhase('intent_error');
      return;
    }

    setPhase('loading_intent');
    setIntentError(null);

    const intentResult = await postTapToPayIntent(accessToken, bookingId.trim(), sessionFees);
    if (!intentResult.ok) {
      setIntentError(intentResult.error.message);
      setPhase('intent_error');
      return;
    }

    setAmountCents(intentResult.amountCents);
    setPaymentIntentId(intentResult.paymentIntentId);
    setClientSecret(intentResult.clientSecret);
    setConnectParams(intentResult.connectParams ?? null);
    setPhase('ready');
  }, [accessToken, amountDueDollars, bookingId, sessionFees]);

  useEffect(() => {
    void loadIntent();
  }, [loadIntent, sessionFeesKey]);

  const finishSuccess = useCallback(
    (resolvedAmountCents, resolvedPaymentIntentId) => {
      setPhase('success');
      fireTapToPaySuccessHaptic();
      schedule(() => {
        onSuccess({
          amountCents: resolvedAmountCents,
          paymentIntentId: resolvedPaymentIntentId,
        });
        runClose(onClose);
      }, TAP_TO_PAY_SUCCESS_DISMISS_MS);
    },
    [onClose, onSuccess, runClose, schedule],
  );

  const runMockCollection = useCallback(() => {
    schedule(() => {
      finishSuccess(amountCents || dollarsToCents(amountDueDollars), paymentIntentId);
    }, TAP_TO_PAY_PENDING_MS);
  }, [amountCents, amountDueDollars, finishSuccess, paymentIntentId, schedule]);

  const handleCollect = useCallback(async () => {
    if (phase !== 'ready' || amountCents <= 0) {
      return;
    }

    clearTimers();
    setPhase('pending');
    fireTapToPayCollectStartHaptic();

    try {
      if (TAP_TO_PAY_USE_SERVER_APIS && paymentIntentId && clientSecret) {
        if (TAP_TO_PAY_USE_TERMINAL_SDK) {
          const result = await collectPayment({
            clientSecret,
            paymentIntentId,
            amountCents,
            connectParams,
            merchantDisplayName,
          });
          finishSuccess(result.amountCents, result.paymentIntentId);
          return;
        }

        if (TAP_TO_PAY_DEV_MOCK_COLLECTION) {
          await collectTapToPayPaymentMock({ paymentIntentId, amountCents });
          runMockCollection();
          return;
        }

        throw new Error('Tap to Pay requires the Stripe Terminal SDK.');
      }

      runMockCollection();
    } catch (err) {
      setPhase('error');
      fireTapToPayErrorHaptic();
      setIntentError(
        err instanceof Error ? err.message : 'Payment failed. Try again or mark as paid.',
      );
    }
  }, [
    amountCents,
    clearTimers,
    clientSecret,
    collectPayment,
    connectParams,
    finishSuccess,
    merchantDisplayName,
    paymentIntentId,
    phase,
    runMockCollection,
  ]);

  const handleDeclinePreview = useCallback(() => {
    if (phase !== 'ready') {
      return;
    }
    clearTimers();
    setPhase('error');
    fireTapToPayErrorHaptic();
    setIntentError('Payment was declined.');
  }, [clearTimers, phase]);

  const handleTryAgain = useCallback(() => {
    clearTimers();
    fireTapToPayRetryHaptic();
    if (intentError && phase === 'intent_error') {
      void loadIntent();
      return;
    }
    setIntentError(null);
    setPhase('ready');
  }, [clearTimers, intentError, loadIntent, phase]);

  const displayAmountDollars = amountCents > 0 ? amountCents / 100 : amountDueDollars;
  const isReady = phase === 'ready';
  const isPending = phase === 'pending';
  const isError = phase === 'error' || phase === 'intent_error';
  const isLoadingIntent = phase === 'loading_intent';
  const locksSheet = isPending || phase === 'success' || isLoadingIntent;
  const showDevDeclinePreview =
    typeof __DEV__ !== 'undefined' && __DEV__ && isReady && TAP_TO_PAY_DEV_MOCK_COLLECTION;

  return {
    phase,
    intentError,
    displayAmountDollars,
    isReady,
    isError,
    isPending,
    isLoadingIntent,
    locksSheet,
    showDevDeclinePreview,
    handleCollect,
    handleDeclinePreview,
    handleTryAgain,
    retryLoadIntent: loadIntent,
  };
}
