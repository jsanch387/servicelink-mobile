import {
  TAP_TO_PAY_DEV_MOCK_COLLECTION,
  TAP_TO_PAY_USE_TERMINAL_SDK,
} from '../constants/tapToPayFeatureFlags';
import { TAP_TO_PAY_PENDING_MS } from '../constants/tapToPayTimings';

/**
 * Dev-only mock when Terminal SDK flag is off.
 *
 * @param {{
 *   paymentIntentId: string;
 *   amountCents: number;
 * }} params
 * @returns {Promise<{ paymentIntentId: string; amountCents: number }>}
 */
export async function collectTapToPayPaymentMock({ paymentIntentId, amountCents }) {
  if (!TAP_TO_PAY_DEV_MOCK_COLLECTION) {
    throw new Error('Tap to Pay requires the Stripe Terminal SDK.');
  }
  await new Promise((resolve) => setTimeout(resolve, TAP_TO_PAY_PENDING_MS));
  return { paymentIntentId, amountCents };
}

/** @deprecated Use {@link useTapToPayTerminalCollection} when `TAP_TO_PAY_USE_TERMINAL_SDK` is true. */
export async function collectTapToPayPayment(params) {
  if (TAP_TO_PAY_USE_TERMINAL_SDK) {
    throw new Error('Use useTapToPayTerminalCollection.collectPayment from a React hook context.');
  }
  return collectTapToPayPaymentMock(params);
}
