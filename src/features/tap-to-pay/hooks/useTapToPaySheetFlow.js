import { useCallback, useEffect, useRef, useState } from 'react';
import { TAP_TO_PAY_PENDING_MS, TAP_TO_PAY_SUCCESS_DISMISS_MS } from '../constants/tapToPayTimings';
import {
  fireTapToPayCollectStartHaptic,
  fireTapToPayErrorHaptic,
  fireTapToPayRetryHaptic,
  fireTapToPaySuccessHaptic,
} from '../utils/tapToPayHaptics';

/**
 * @param {{
 *   amountDue: number;
 *   onSuccess: (amount: number) => void;
 *   onClose: () => void;
 *   runClose: (afterClose?: () => void) => void;
 * }} options
 */
export function useTapToPaySheetFlow({ amountDue, onSuccess, onClose, runClose }) {
  const [phase, setPhase] = useState(
    /** @type {import('../constants/tapToPayCopy').TapToPayPhase} */ ('ready'),
  );
  const timersRef = useRef(/** @type {ReturnType<typeof setTimeout>[]} */ ([]));
  const outcomeRef = useRef(/** @type {'success' | 'error'} */ ('success'));

  const isReady = phase === 'ready';
  const isPending = phase === 'pending';
  const isError = phase === 'error';
  const locksSheet = isPending || phase === 'success';
  const showDevDeclinePreview = typeof __DEV__ !== 'undefined' && __DEV__;

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

  const runCollection = useCallback(
    (outcome) => {
      if (!isReady || amountDue <= 0) {
        return;
      }

      outcomeRef.current = outcome;
      clearTimers();
      setPhase('pending');
      fireTapToPayCollectStartHaptic();

      schedule(() => {
        if (outcomeRef.current === 'error') {
          setPhase('error');
          fireTapToPayErrorHaptic();
          return;
        }

        setPhase('success');
        fireTapToPaySuccessHaptic();

        schedule(() => {
          onSuccess(amountDue);
          runClose(onClose);
        }, TAP_TO_PAY_SUCCESS_DISMISS_MS);
      }, TAP_TO_PAY_PENDING_MS);
    },
    [amountDue, clearTimers, isReady, onClose, onSuccess, runClose, schedule],
  );

  const handleCollect = useCallback(() => {
    runCollection('success');
  }, [runCollection]);

  const handleDeclinePreview = useCallback(() => {
    runCollection('error');
  }, [runCollection]);

  const handleTryAgain = useCallback(() => {
    clearTimers();
    setPhase('ready');
    fireTapToPayRetryHaptic();
  }, [clearTimers]);

  return {
    phase,
    isReady,
    isError,
    locksSheet,
    showDevDeclinePreview,
    handleCollect,
    handleDeclinePreview,
    handleTryAgain,
  };
}
