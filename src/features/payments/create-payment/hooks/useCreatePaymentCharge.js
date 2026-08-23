import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useToast } from '../../../../components/ui';
import { postTapToPayMerchantIntent } from '../../../tap-to-pay/api/postTapToPayMerchantIntent';
import { isTapToPayUiEnabled } from '../../../tap-to-pay/constants/tapToPayFeatureFlags';
import { isTapToPayCanceledTerminalError } from '../../../tap-to-pay/constants/tapToPayCopy';
import { useTapToPayConnectReadiness } from '../../../tap-to-pay/hooks/useTapToPayConnectReadiness';
import { useTapToPayTerminalCollection } from '../../../tap-to-pay/hooks/useTapToPayTerminalCollection';
import { setTapToPayConnectionTokenStripeAccountId } from '../../../tap-to-pay/terminal/tapToPayConnectionTokenRegistry';
import { isTapToPayNativeRuntimeAvailable } from '../../../tap-to-pay/utils/isTapToPayNativeRuntimeAvailable';
import { hasCreatePaymentNote, parseCreatePaymentAmount } from '../utils/createPaymentAmount';

/**
 * Charge on Tap to pay: create a walk-up intent, then open Apple's Tap to Pay UI.
 * No ServiceLink sheet — the reader is the UI.
 */
export function useCreatePaymentCharge({ accessToken, amount, note, onSuccess }) {
  const toast = useToast();
  const { collectPayment } = useTapToPayTerminalCollection();
  const { isConnectReady, merchantDisplayName, stripeAccountId, terminalLocationId } =
    useTapToPayConnectReadiness();
  const [charging, setCharging] = useState(false);

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
    setCharging(true);
    try {
      const intent = await postTapToPayMerchantIntent(accessToken, {
        amountCents,
        note,
        stripeAccountId,
      });
      if (!intent.ok) {
        toast.error(intent.error.message);
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
      });

      toast.success('Paid');
      onSuccess?.(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Payment failed. Try again.';
      const code =
        err && typeof err === 'object' && 'code' in err && typeof err.code === 'string'
          ? err.code
          : null;
      if (isTapToPayCanceledTerminalError(code, message)) {
        return;
      }
      toast.error(message);
    } finally {
      setCharging(false);
    }
  }, [
    accessToken,
    amount,
    charging,
    collectPayment,
    isConnectReady,
    merchantDisplayName,
    note,
    onSuccess,
    stripeAccountId,
    terminalLocationId,
    toast,
  ]);

  return { charge, charging };
}
