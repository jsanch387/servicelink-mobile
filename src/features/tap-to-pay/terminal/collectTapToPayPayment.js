import { TAP_TO_PAY_DEV_MOCK_COLLECTION } from '../constants/tapToPayFeatureFlags';
import { TAP_TO_PAY_PENDING_MS } from '../constants/tapToPayTimings';

/**
 * Dev-only mock collection when `TAP_TO_PAY_USE_TERMINAL_SDK` is false.
 * Production uses {@link useTapToPayTerminalCollection}.
 *
 * @param {{
 *   paymentIntentId: string;
 *   amountCents: number;
 *   onProcessingStart?: () => void;
 * }} params
 * @returns {Promise<{ paymentIntentId: string; amountCents: number }>}
 */
export async function collectTapToPayPaymentMock({
  paymentIntentId,
  amountCents,
  onProcessingStart,
}) {
  if (!TAP_TO_PAY_DEV_MOCK_COLLECTION) {
    throw new Error('Tap to Pay requires the Stripe Terminal SDK.');
  }
  // Simulate Apple reader UI while the sheet stays on "preparing".
  await new Promise((resolve) => setTimeout(resolve, TAP_TO_PAY_PENDING_MS));
  onProcessingStart?.();
  // Simulate Stripe authorization after Apple's reader UI closes.
  await new Promise((resolve) => setTimeout(resolve, TAP_TO_PAY_PENDING_MS));
  return { paymentIntentId, amountCents };
}
