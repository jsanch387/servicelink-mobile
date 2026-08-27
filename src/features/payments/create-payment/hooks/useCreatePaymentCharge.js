import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useToast } from '../../../../components/ui';
import { postTapToPayMerchantIntent } from '../../../tap-to-pay/api/postTapToPayMerchantIntent';
import { isTapToPayUiEnabled } from '../../../tap-to-pay/constants/tapToPayFeatureFlags';
import {
  isTapToPayCanceledTerminalError,
  TAP_TO_PAY_PAYMENT_CANCELED,
} from '../../../tap-to-pay/constants/tapToPayCopy';
import { useTapToPayConnectReadiness } from '../../../tap-to-pay/hooks/useTapToPayConnectReadiness';
import { useTapToPayTerminalCollection } from '../../../tap-to-pay/hooks/useTapToPayTerminalCollection';
import { setTapToPayConnectionTokenStripeAccountId } from '../../../tap-to-pay/terminal/tapToPayConnectionTokenRegistry';
import { isTapToPayReaderWarm } from '../../../tap-to-pay/terminal/tapToPayTerminalSession';
import { isTapToPayNativeRuntimeAvailable } from '../../../tap-to-pay/utils/isTapToPayNativeRuntimeAvailable';
import { logTapToPayDebug } from '../../../tap-to-pay/utils/logTapToPayDebug';
import {
  hasCreatePaymentNote,
  parseCreatePaymentAmount,
  sanitizeCreatePaymentNote,
} from '../utils/createPaymentAmount';

/** @typedef {'idle' | 'loading_intent' | 'intent_error' | 'preparing' | 'processing' | 'success' | 'error'} CreatePaymentChargePhase */

/**
 * Charge on Tap to pay: create a walk-up intent, then open Apple's Tap to Pay UI.
 */
export function useCreatePaymentCharge({ accessToken, amount, note, onSuccess }) {
  const toast = useToast();
  const { collectPayment, prewarmReaderForCollect } = useTapToPayTerminalCollection();
  const { isConnectReady, merchantDisplayName, stripeAccountId, terminalLocationId } =
    useTapToPayConnectReadiness();
  const [phase, setPhase] = useState(/** @type {CreatePaymentChargePhase} */ ('idle'));
  const [error, setError] = useState(/** @type {string | null} */ (null));
  const [readerWasWarmAtStart, setReaderWasWarmAtStart] = useState(false);

  const charging = phase === 'preparing' || phase === 'loading_intent' || phase === 'processing';

  const charge = useCallback(async () => {
    if (charging) {
      return;
    }
    const parsedAmount = parseCreatePaymentAmount(amount);
    if (parsedAmount == null || !hasCreatePaymentNote(note)) {
      return;
    }
    if (!isTapToPayUiEnabled()) {
      toast.info('Tap to Pay is available on iPhone.');
      return;
    }
    if (!isTapToPayNativeRuntimeAvailable()) {
      Alert.alert(
        'Development build required',
        'Tap to Pay needs a development build with Stripe Terminal. It is not available in Expo Go.',
      );
      return;
    }
    if (!accessToken) {
      toast.error('Sign in again to collect payment.');
      return;
    }
    if (!isConnectReady) {
      toast.error('Set up Stripe payments to use Tap to Pay.');
      return;
    }

    const amountCents = Math.round(parsedAmount * 100);
    const connectParams = {
      terminalLocationId,
      stripeAccountId,
      merchantDisplayName,
    };
    const readerWarm = isTapToPayReaderWarm();
    setReaderWasWarmAtStart(readerWarm);
    setError(null);
    setPhase(readerWarm ? 'loading_intent' : 'preparing');
    try {
      const readerPrewarmPromise =
        typeof prewarmReaderForCollect === 'function' && !readerWarm
          ? prewarmReaderForCollect({
              connectParams,
              merchantDisplayName,
              reason: 'walkup_charge_parallel',
            }).catch((err) => {
              logTapToPayDebug('walkup.prewarm.failed', {
                message: err instanceof Error ? err.message : 'Prewarm failed',
              });
            })
          : Promise.resolve();

      const [intent] = await Promise.all([
        postTapToPayMerchantIntent(accessToken, {
          amountCents,
          note: sanitizeCreatePaymentNote(note),
          stripeAccountId,
        }),
        readerPrewarmPromise,
      ]);
      if (!intent.ok) {
        setPhase('intent_error');
        setError(intent.error.message);
        return;
      }

      setTapToPayConnectionTokenStripeAccountId(
        intent.connectParams?.stripeAccountId ?? stripeAccountId,
      );

      const result = await collectPayment({
        clientSecret: intent.clientSecret,
        paymentIntentId: intent.paymentIntentId,
        amountCents: intent.amountCents,
        connectParams: {
          terminalLocationId: intent.connectParams?.terminalLocationId ?? terminalLocationId,
          stripeAccountId: intent.connectParams?.stripeAccountId ?? stripeAccountId,
          merchantDisplayName: intent.connectParams?.merchantDisplayName ?? merchantDisplayName,
        },
        merchantDisplayName,
        onProcessingStart: () => setPhase('processing'),
      });

      setPhase('success');
      onSuccess?.(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Payment failed. Try again.';
      const code =
        err && typeof err === 'object' && 'code' in err && typeof err.code === 'string'
          ? err.code
          : null;
      setPhase('error');
      setError(
        isTapToPayCanceledTerminalError(code, message) ? TAP_TO_PAY_PAYMENT_CANCELED : message,
      );
    }
  }, [
    accessToken,
    amount,
    charging,
    collectPayment,
    isConnectReady,
    prewarmReaderForCollect,
    merchantDisplayName,
    note,
    onSuccess,
    stripeAccountId,
    terminalLocationId,
    toast,
  ]);

  const previewPaid = useCallback(() => {
    if (typeof __DEV__ === 'undefined' || !__DEV__) {
      return;
    }
    const parsedAmount = parseCreatePaymentAmount(amount);
    if (parsedAmount == null || !hasCreatePaymentNote(note) || charging) {
      return;
    }
    setError(null);
    setPhase('success');
    onSuccess?.({
      paymentIntentId: null,
      amountCents: Math.round(parsedAmount * 100),
    });
  }, [amount, charging, note, onSuccess]);

  return {
    charge,
    previewPaid,
    charging,
    phase,
    error,
    readerWasWarmAtStart,
  };
}
