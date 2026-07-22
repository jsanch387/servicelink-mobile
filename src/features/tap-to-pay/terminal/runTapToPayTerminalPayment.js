import {
  logTapToPayDebug,
  logTapToPayFailure,
  logTapToPayInfo,
  maskId,
} from '../utils/logTapToPayDebug';
import { createTapToPayStagedError } from '../utils/createTapToPayStagedError';
import { mapTapToPayTerminalErrorMessage } from './tapToPayTerminalConnect';

/** @typedef {import('@stripe/stripe-terminal-react-native').PaymentIntent.Type} StripePaymentIntent */

/**
 * Apple 5.6 — collect on device (Apple Tap to Pay UI), then show merchant processing,
 * then confirm with Stripe. Split from `processPaymentIntent` so processing starts only
 * after the card read completes and Apple's reader UI closes.
 *
 * @param {{
 *   paymentIntent: StripePaymentIntent;
 *   collectPaymentMethod: (params: {
 *     paymentIntent: StripePaymentIntent;
 *     skipTipping?: boolean;
 *   }) => Promise<{ paymentIntent?: StripePaymentIntent; error?: { message?: string; code?: string } }>;
 *   confirmPaymentIntent: (params: {
 *     paymentIntent: StripePaymentIntent;
 *   }) => Promise<{ paymentIntent?: StripePaymentIntent; error?: { message?: string; code?: string } }>;
 *   onProcessingStart?: () => void;
 * }} params
 * @returns {Promise<StripePaymentIntent>}
 */
export async function runTapToPayTerminalPayment({
  paymentIntent,
  collectPaymentMethod,
  confirmPaymentIntent,
  onProcessingStart,
}) {
  logTapToPayDebug('terminal.collect_method.start', {
    paymentIntentId: maskId(paymentIntent.id),
    status: paymentIntent.status,
  });

  const { paymentIntent: collectedIntent, error: collectError } = await collectPaymentMethod({
    paymentIntent,
    skipTipping: true,
  });
  if (collectError || !collectedIntent) {
    logTapToPayFailure('terminal.collect_method', {
      message: collectError?.message,
      code: collectError?.code,
    });
    throw createTapToPayStagedError(
      'collect',
      mapTapToPayTerminalErrorMessage(
        collectError?.code,
        collectError?.message || 'Payment failed. Try again or mark as paid.',
      ),
      collectError?.code,
    );
  }

  logTapToPayDebug('terminal.collect_method.ok', {
    paymentIntentId: maskId(collectedIntent.id),
    status: collectedIntent.status,
  });

  onProcessingStart?.();

  logTapToPayDebug('terminal.confirm.start', {
    paymentIntentId: maskId(collectedIntent.id),
    status: collectedIntent.status,
  });

  const { paymentIntent: confirmedIntent, error: confirmError } = await confirmPaymentIntent({
    paymentIntent: collectedIntent,
  });
  if (confirmError || !confirmedIntent) {
    logTapToPayFailure('terminal.confirm', {
      message: confirmError?.message,
      code: confirmError?.code,
    });
    throw createTapToPayStagedError(
      'confirm',
      mapTapToPayTerminalErrorMessage(
        confirmError?.code,
        confirmError?.message || 'Payment failed. Try again or mark as paid.',
      ),
      confirmError?.code,
    );
  }

  logTapToPayInfo('payment.confirmed', {
    paymentIntentId: maskId(confirmedIntent.id),
    status: confirmedIntent.status,
    amount: confirmedIntent.amount,
  });

  return confirmedIntent;
}
