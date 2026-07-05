import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { postTapToPayConnectionToken } from '../api/postTapToPayConnectionToken';
import { postTapToPayIntent } from '../api/postTapToPayIntent';
import {
  TAP_TO_PAY_DEV_MOCK_COLLECTION,
  TAP_TO_PAY_USE_SERVER_APIS,
  TAP_TO_PAY_USE_TERMINAL_SDK,
} from '../constants/tapToPayFeatureFlags';
import { TAP_TO_PAY_SUCCESS_DISMISS_MS } from '../constants/tapToPayTimings';
import { collectTapToPayPaymentMock } from '../terminal/collectTapToPayPayment';
import {
  clearBookingTapToPayConnectionTokenFetcher,
  getTapToPayConnectionTokenStripeAccountId,
  setBookingTapToPayConnectionTokenFetcher,
  setTapToPayConnectionTokenStripeAccountId,
} from '../terminal/tapToPayConnectionTokenRegistry';
import { isTapToPayReaderWarm } from '../terminal/tapToPayTerminalSession';
import {
  logTapToPayDebug,
  logTapToPayFailure,
  logTapToPayInfo,
  maskId,
} from '../utils/logTapToPayDebug';
import { useTapToPayTerminalCollection } from './useTapToPayTerminalCollection';
import {
  fireTapToPayCollectStartHaptic,
  fireTapToPayErrorHaptic,
  fireTapToPayRetryHaptic,
  fireTapToPaySuccessHaptic,
} from '../utils/tapToPayHaptics';

/** @typedef {'loading_intent' | 'intent_error' | 'preparing' | 'processing' | 'success' | 'error'} TapToPaySheetPhase */

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

function getInitialTapToPayState(amountDueDollars, accessToken, bookingId) {
  const dueCents = dollarsToCents(amountDueDollars);
  if (dueCents <= 0) {
    return {
      phase: /** @type {TapToPaySheetPhase} */ ('intent_error'),
      intentError: 'Nothing to collect.',
    };
  }

  if (TAP_TO_PAY_USE_SERVER_APIS && (!accessToken || !bookingId?.trim())) {
    return {
      phase: /** @type {TapToPaySheetPhase} */ ('intent_error'),
      intentError: 'Sign in again to collect payment.',
    };
  }

  return {
    phase: /** @type {TapToPaySheetPhase} */ ('loading_intent'),
    intentError: null,
  };
}

/**
 * Tap to Pay sheet flow: intent on open → Terminal collection → success callback.
 *
 * Opening the sheet starts a collection session immediately (no in-sheet tap). Each session
 * calls `POST …/tap-to-pay/intent` once; Try again creates a fresh intent. See
 * `MOBILE_BOOKING_TAP_TO_PAY.md` for the full contract.
 *
 * @param {{
 *   accessToken: string | null | undefined;
 *   bookingId: string | null | undefined;
 *   sessionFees: Array<{ label: string; amountCents: number }>;
 *   amountDueDollars: number;
 *   merchantDisplayName?: string | null;
 *   prewarmConnectParams?: import('../utils/parseTapToPayIntentConnectParams').TapToPayConnectParams | null;
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
  prewarmConnectParams = null,
  onSuccess,
  onClose,
  runClose,
}) {
  const { collectPayment, prewarmReaderForCollect } = useTapToPayTerminalCollection();
  const initialState = useMemo(
    () => getInitialTapToPayState(amountDueDollars, accessToken, bookingId),
    [accessToken, amountDueDollars, bookingId],
  );
  const [phase, setPhase] = useState(/** @type {TapToPaySheetPhase} */ (initialState.phase));
  const [intentError, setIntentError] = useState(
    /** @type {string | null} */ (initialState.intentError),
  );
  const [amountCents, setAmountCents] = useState(0);
  const [reservesTryAgainFooter, setReservesTryAgainFooter] = useState(false);
  const [readerWasWarmAtStart, setReaderWasWarmAtStart] = useState(false);
  const sessionRunRef = useRef(0);
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
    if (phase === 'success') {
      setReservesTryAgainFooter(false);
    }
  }, [phase]);

  useEffect(() => {
    if (!TAP_TO_PAY_USE_TERMINAL_SDK || !accessToken || !bookingId?.trim()) {
      clearBookingTapToPayConnectionTokenFetcher();
      return undefined;
    }

    setBookingTapToPayConnectionTokenFetcher(async () => {
      const stripeAccountId = getTapToPayConnectionTokenStripeAccountId();
      const tokenResult = await postTapToPayConnectionToken(accessToken, bookingId.trim(), {
        stripeAccountId,
      });
      if (!tokenResult.ok) {
        logTapToPayFailure('connection-token', {
          message: tokenResult.error.message,
          httpStatus: tokenResult.httpStatus,
          requestId: tokenResult.requestId,
        });
        throw tokenResult.error;
      }
      return tokenResult.secret;
    });

    return () => {
      clearBookingTapToPayConnectionTokenFetcher();
    };
  }, [accessToken, bookingId]);

  /**
   * @returns {Promise<
   *   | { ok: true; amountCents: number; paymentIntentId: string | null; clientSecret: string | null; connectParams: import('../utils/parseTapToPayIntentConnectParams').TapToPayConnectParams | null }
   *   | { ok: false }
   * >}
   */
  const loadIntent = useCallback(async () => {
    const resolvedSessionFees = JSON.parse(sessionFeesKey);
    if (!TAP_TO_PAY_USE_SERVER_APIS) {
      const cents = dollarsToCents(amountDueDollars);
      if (cents <= 0) {
        setIntentError('Nothing to collect.');
        setPhase('intent_error');
        fireTapToPayErrorHaptic();
        return { ok: false };
      }

      setAmountCents(cents);
      setIntentError(null);
      return {
        ok: true,
        amountCents: cents,
        paymentIntentId: null,
        clientSecret: null,
        connectParams: null,
      };
    }

    if (!accessToken || !bookingId?.trim()) {
      setIntentError('Sign in again to collect payment.');
      setPhase('intent_error');
      fireTapToPayErrorHaptic();
      return { ok: false };
    }

    const intentResult = await postTapToPayIntent(
      accessToken,
      bookingId.trim(),
      resolvedSessionFees,
    );
    if (!intentResult.ok) {
      logTapToPayFailure('intent', {
        message: intentResult.error.message,
        httpStatus: intentResult.httpStatus,
        requestId: intentResult.requestId,
      });
      setIntentError(intentResult.error.message);
      setPhase('intent_error');
      fireTapToPayErrorHaptic();
      return { ok: false };
    }

    setAmountCents(intentResult.amountCents);
    setTapToPayConnectionTokenStripeAccountId(intentResult.connectParams?.stripeAccountId);
    logTapToPayInfo('intent.ok', {
      bookingId: maskId(bookingId),
      paymentIntentId: maskId(intentResult.paymentIntentId),
      amountCents: intentResult.amountCents,
      terminalLocationId: maskId(intentResult.connectParams?.terminalLocationId),
      stripeAccountId: maskId(intentResult.connectParams?.stripeAccountId),
      requestId: intentResult.requestId,
    });
    return {
      ok: true,
      amountCents: intentResult.amountCents,
      paymentIntentId: intentResult.paymentIntentId,
      clientSecret: intentResult.clientSecret,
      connectParams: intentResult.connectParams ?? null,
    };
  }, [accessToken, amountDueDollars, bookingId, sessionFeesKey]);

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

  const runMockCollection = useCallback(
    (resolvedAmountCents, resolvedPaymentIntentId) => {
      finishSuccess(resolvedAmountCents, resolvedPaymentIntentId);
    },
    [finishSuccess],
  );

  const beginProcessingPhase = useCallback((runId) => {
    if (runId === sessionRunRef.current) {
      setPhase('processing');
    }
  }, []);

  const startCollectionSession = useCallback(async () => {
    if (dollarsToCents(amountDueDollars) <= 0) {
      setIntentError('Nothing to collect.');
      setPhase('intent_error');
      fireTapToPayErrorHaptic();
      return;
    }

    const runId = sessionRunRef.current + 1;
    sessionRunRef.current = runId;
    clearTimers();
    setIntentError(null);

    const readerColdAtStart = !isTapToPayReaderWarm();
    setReaderWasWarmAtStart(!readerColdAtStart);
    setPhase(readerColdAtStart ? 'preparing' : 'loading_intent');

    logTapToPayDebug('session.start', {
      runId,
      bookingId: maskId(bookingId),
      amountDueDollars,
      sessionFeeCount: JSON.parse(sessionFeesKey).length,
      terminalSdk: TAP_TO_PAY_USE_TERMINAL_SDK,
      serverApis: TAP_TO_PAY_USE_SERVER_APIS,
      readerCold: readerColdAtStart,
    });

    const readerPrewarmPromise =
      TAP_TO_PAY_USE_TERMINAL_SDK && readerColdAtStart && prewarmConnectParams
        ? prewarmReaderForCollect({
            connectParams: prewarmConnectParams,
            merchantDisplayName,
            reason: 'collect_parallel',
          }).catch((err) => {
            logTapToPayDebug('session.prewarm.failed', {
              runId,
              message: err instanceof Error ? err.message : 'Prewarm failed',
            });
          })
        : Promise.resolve();

    const [intentResult] = await Promise.all([loadIntent(), readerPrewarmPromise]);
    if (runId !== sessionRunRef.current || !intentResult.ok) {
      if (runId === sessionRunRef.current && !intentResult.ok) {
        logTapToPayDebug('session.stop', { runId, reason: 'intent_failed' });
      }
      return;
    }

    fireTapToPayCollectStartHaptic();
    logTapToPayDebug('session.preparing', {
      runId,
      paymentIntentId: maskId(intentResult.paymentIntentId),
      amountCents: intentResult.amountCents,
      readerWarm: isTapToPayReaderWarm(),
    });

    try {
      if (TAP_TO_PAY_USE_SERVER_APIS && intentResult.paymentIntentId && intentResult.clientSecret) {
        if (TAP_TO_PAY_USE_TERMINAL_SDK) {
          const result = await collectPayment({
            clientSecret: intentResult.clientSecret,
            paymentIntentId: intentResult.paymentIntentId,
            amountCents: intentResult.amountCents,
            connectParams: intentResult.connectParams,
            merchantDisplayName,
            onProcessingStart: () => beginProcessingPhase(runId),
          });
          if (runId !== sessionRunRef.current) {
            return;
          }
          logTapToPayInfo('payment.success', {
            runId,
            paymentIntentId: maskId(result.paymentIntentId),
            amountCents: result.amountCents,
          });
          finishSuccess(result.amountCents, result.paymentIntentId);
          return;
        }

        if (TAP_TO_PAY_DEV_MOCK_COLLECTION) {
          await collectTapToPayPaymentMock({
            paymentIntentId: intentResult.paymentIntentId,
            amountCents: intentResult.amountCents,
            onProcessingStart: () => beginProcessingPhase(runId),
          });
          if (runId !== sessionRunRef.current) {
            return;
          }
          runMockCollection(intentResult.amountCents, intentResult.paymentIntentId);
          return;
        }

        throw new Error('Tap to Pay requires the Stripe Terminal SDK.');
      }

      runMockCollection(intentResult.amountCents, intentResult.paymentIntentId);
    } catch (err) {
      if (runId !== sessionRunRef.current) {
        return;
      }
      setPhase('error');
      fireTapToPayErrorHaptic();
      const message =
        err instanceof Error ? err.message : 'Payment failed. Try again or mark as paid.';
      logTapToPayFailure('collection', { message });
      setIntentError(message);
    }
  }, [
    amountDueDollars,
    beginProcessingPhase,
    bookingId,
    clearTimers,
    collectPayment,
    finishSuccess,
    loadIntent,
    merchantDisplayName,
    prewarmConnectParams,
    prewarmReaderForCollect,
    runMockCollection,
    sessionFeesKey,
  ]);

  useEffect(() => {
    if (initialState.phase === 'intent_error') {
      logTapToPayDebug('sheet.blocked', {
        bookingId: maskId(bookingId),
        reason: initialState.intentError,
      });
      return undefined;
    }
    void startCollectionSession();
    return () => {
      logTapToPayDebug('sheet.unmount', { bookingId: maskId(bookingId) });
      sessionRunRef.current += 1;
    };
    // Restart only when fee lines or booking auth inputs change — not when callbacks are recreated.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- startCollectionSession is intentionally excluded
  }, [initialState.phase, sessionFeesKey, accessToken, bookingId, amountDueDollars]);

  const handleTryAgain = useCallback(() => {
    sessionRunRef.current += 1;
    clearTimers();
    fireTapToPayRetryHaptic();
    setReservesTryAgainFooter(true);
    void startCollectionSession();
  }, [clearTimers, startCollectionSession]);

  const displayAmountDollars = amountCents > 0 ? amountCents / 100 : amountDueDollars;
  const isPreparing = phase === 'preparing';
  const isProcessing = phase === 'processing';
  const isError = phase === 'error' || phase === 'intent_error';
  const isLoadingIntent = phase === 'loading_intent';
  const locksSheet = isPreparing || isProcessing || phase === 'success' || isLoadingIntent;
  const showTryAgainFooter = isError || (reservesTryAgainFooter && isLoadingIntent);

  return {
    phase,
    intentError,
    displayAmountDollars,
    isError,
    isPreparing,
    isProcessing,
    isLoadingIntent,
    readerWasWarmAtStart,
    locksSheet,
    showTryAgainFooter,
    handleTryAgain,
    retryLoadIntent: startCollectionSession,
  };
}
