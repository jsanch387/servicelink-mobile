import { BOOKING_ACTION } from '../../constants/jobStatus';
import { parseAddonLineItemsFromBooking } from './parseAddonLineItemsFromBooking';

/**
 * @typedef {object} CompleteVisitCheckoutState
 * @property {Array<{ label: string; amount: number }>} sessionFees — dollar amounts from fee adjustments
 * @property {{
 *   method: string;
 *   amount: number;
 *   stripePaymentIntentId?: string | null;
 * } | null} sessionPayment — in-person or tap-to-pay collection; omit when paid in full online
 */

/**
 * @typedef {object} JobCompletedRequestBody
 * @property {'job_completed'} action
 * @property {Array<{ label: string; amountCents: number }>} [sessionFees]
 * @property {{
 *   method: string;
 *   amountCents: number;
 *   stripePaymentIntentId?: string;
 * } | undefined} [sessionPayment]
 */

/**
 * @param {number} amount
 * @returns {number}
 */
export function dollarsToCents(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) {
    return 0;
  }
  return Math.round(n * 100);
}

/**
 * @param {Array<{ label: string; amount: number }>} sessionFees
 * @returns {Array<{ label: string; amountCents: number }>}
 */
export function mapSessionFeesToCents(sessionFees) {
  return (sessionFees ?? []).map((fee, index) => ({
    label: String(fee?.label ?? '').trim() || `Fee ${index + 1}`,
    amountCents: Math.max(0, dollarsToCents(fee?.amount)),
  }));
}

/**
 * @param {CompleteVisitCheckoutState['sessionPayment']} sessionPayment
 * @returns {JobCompletedRequestBody['sessionPayment'] | undefined}
 */
export function mapSessionPaymentToCents(sessionPayment) {
  if (!sessionPayment || sessionPayment.amount <= 0) {
    return undefined;
  }

  const method = String(sessionPayment.method ?? '').trim();
  if (!method) {
    return undefined;
  }

  if (method === 'tap_to_pay' && !sessionPayment.stripePaymentIntentId?.trim()) {
    throw new Error('Tap to Pay is not ready yet. Record payment with Mark as paid.');
  }

  /** @type {NonNullable<JobCompletedRequestBody['sessionPayment']>} */
  const mapped = {
    method,
    amountCents: Math.max(0, dollarsToCents(sessionPayment.amount)),
  };

  const intentId = sessionPayment.stripePaymentIntentId?.trim();
  if (intentId) {
    mapped.stripePaymentIntentId = intentId;
  }

  return mapped;
}

/**
 * Maps complete-visit checkout state to the `job_completed` actions API body.
 *
 * @param {CompleteVisitCheckoutState} checkout
 * @returns {JobCompletedRequestBody}
 */
export function buildJobCompletedPayload(checkout) {
  const sessionFees = mapSessionFeesToCents(checkout.sessionFees);
  const sessionPayment = mapSessionPaymentToCents(checkout.sessionPayment);

  /** @type {JobCompletedRequestBody} */
  const body = { action: BOOKING_ACTION.JOB_COMPLETED };

  if (sessionFees.length > 0) {
    body.sessionFees = sessionFees;
  }
  if (sessionPayment) {
    body.sessionPayment = sessionPayment;
  }

  return body;
}

/**
 * @param {number} tapToPayAmount
 * @param {{ method: string; amount: number } | null} inPersonPayment
 * @param {string | null | undefined} stripePaymentIntentId
 * @returns {CompleteVisitCheckoutState['sessionPayment']}
 */
export function resolveCompleteVisitSessionPayment(
  tapToPayAmount,
  inPersonPayment,
  stripePaymentIntentId,
) {
  if (tapToPayAmount > 0) {
    return {
      method: 'tap_to_pay',
      amount: tapToPayAmount,
      stripePaymentIntentId: stripePaymentIntentId ?? null,
    };
  }

  if (inPersonPayment && inPersonPayment.amount > 0) {
    return {
      method: inPersonPayment.method,
      amount: inPersonPayment.amount,
      stripePaymentIntentId: null,
    };
  }

  return null;
}

/**
 * @param {{
 *   adjustments: Array<{ label: string; amount: number }>;
 *   tapToPayAmount: number;
 *   inPersonPayment: { method: string; amount: number } | null;
 *   stripePaymentIntentId?: string | null;
 * }} sheetState
 * @returns {CompleteVisitCheckoutState}
 */
export function buildCompleteVisitCheckoutFromSheetState(sheetState) {
  return {
    sessionFees: sheetState.adjustments.map((item) => ({
      label: item.label,
      amount: item.amount,
    })),
    sessionPayment: resolveCompleteVisitSessionPayment(
      sheetState.tapToPayAmount,
      sheetState.inPersonPayment,
      sheetState.stripePaymentIntentId,
    ),
  };
}

/**
 * Server-side amount-due check (cents). Matches Phase 1 handler math.
 *
 * @param {{
 *   servicePriceCents: number;
 *   addonDetails: unknown;
 *   sessionFees: Array<{ amountCents: number }>;
 *   paidOnlineCents: number;
 *   sessionPaymentAmountCents: number;
 *   discountCents?: number;
 * }} params
 * @returns {number}
 */
export function computeCompleteVisitAmountDueCents({
  servicePriceCents,
  addonDetails,
  sessionFees,
  paidOnlineCents,
  sessionPaymentAmountCents,
  discountCents = 0,
}) {
  const serviceCents = Math.max(0, Number(servicePriceCents) || 0);
  const addonCents = parseAddonLineItemsFromBooking(addonDetails).reduce(
    (sum, item) => sum + Math.max(0, dollarsToCents(item.price)),
    0,
  );
  const feesCents = (sessionFees ?? []).reduce(
    (sum, fee) => sum + Math.max(0, Number(fee.amountCents) || 0),
    0,
  );
  const discount = Math.max(0, Math.round(Number(discountCents) || 0));
  const paidOnline = Math.max(0, Number(paidOnlineCents) || 0);
  const sessionPaid = Math.max(0, Number(sessionPaymentAmountCents) || 0);
  const subtotal = Math.max(0, serviceCents + addonCents - discount) + feesCents;
  return Math.max(0, subtotal - paidOnline - sessionPaid);
}

/**
 * Mock tap-to-pay settles UI amount due but cannot submit until Stripe intent exists (Phase 2).
 *
 * @param {{
 *   tapToPayAmount: number;
 *   stripePaymentIntentId?: string | null;
 *   isDesignPreview?: boolean;
 * }} params
 * @returns {boolean}
 */
export function canSubmitJobCompletedCheckout({
  tapToPayAmount,
  stripePaymentIntentId,
  isDesignPreview = false,
}) {
  if (isDesignPreview) {
    return true;
  }
  if (tapToPayAmount > 0 && !stripePaymentIntentId?.trim()) {
    return false;
  }
  return true;
}
