import { dollarsToCents } from './buildJobCompletedPayload';
import { parseAddonLineItemsFromBooking } from './parseAddonLineItemsFromBooking';

/**
 * Merges a Complete visit checkout snapshot into a booking details row (fills gaps only).
 *
 * @param {Record<string, unknown> | null | undefined} booking
 * @param {import('./buildJobCompletedPayload').CompleteVisitCheckoutState | null | undefined} checkout
 * @returns {Record<string, unknown> | null | undefined}
 */
export function applyCheckoutSnapshotToBooking(booking, checkout) {
  if (!booking || typeof booking !== 'object' || !checkout) {
    return booking;
  }

  const sessionFeeLines = (checkout.sessionFees ?? []).map((fee, index) => ({
    id: `checkout-fee-${index + 1}`,
    label: String(fee?.label ?? '').trim() || `Fee ${index + 1}`,
    amount_cents: Math.max(0, dollarsToCents(fee?.amount)),
    sort_order: index,
  }));
  const sessionFeesTotalCents = sessionFeeLines.reduce(
    (sum, line) => sum + Math.max(0, Number(line.amount_cents) || 0),
    0,
  );
  const sessionPayment = checkout.sessionPayment;
  const sessionPaymentAmountCents =
    sessionPayment && sessionPayment.amount > 0 ? dollarsToCents(sessionPayment.amount) : 0;

  const existingLines = booking.session_fee_lines ?? booking.sessionFeeLines;
  const hasExistingLines = Array.isArray(existingLines) && existingLines.length > 0;

  const existingPayment =
    booking.payment && typeof booking.payment === 'object' ? { ...booking.payment } : {};
  const paidOnlineAmountCents = Math.max(
    0,
    Number(
      existingPayment.paidOnlineAmountCents ?? existingPayment.paid_online_amount_cents ?? 0,
    ) || 0,
  );
  const serviceCents = Math.max(0, Number(booking.service_price_cents ?? 0) || 0);
  const addonCents = parseAddonLineItemsFromBooking(booking.addon_details).reduce(
    (sum, item) => sum + Math.max(0, dollarsToCents(item.price)),
    0,
  );
  const snapshotTotalCents = serviceCents + addonCents + sessionFeesTotalCents;
  const existingTotalCents = Math.max(
    0,
    Number(existingPayment.totalAmountCents ?? existingPayment.total_amount_cents ?? 0) || 0,
  );

  /** @type {Record<string, unknown>} */
  const nextPayment = { ...existingPayment };

  if (sessionFeesTotalCents > 0) {
    nextPayment.sessionFeesTotalCents = Math.max(
      Number(
        existingPayment.sessionFeesTotalCents ?? existingPayment.session_fees_total_cents ?? 0,
      ) || 0,
      sessionFeesTotalCents,
    );
    nextPayment.session_fees_total_cents = nextPayment.sessionFeesTotalCents;
  }

  if (snapshotTotalCents > existingTotalCents) {
    nextPayment.totalAmountCents = snapshotTotalCents;
    nextPayment.total_amount_cents = snapshotTotalCents;
  }

  nextPayment.remainingAmountCents = 0;
  nextPayment.remaining_amount_cents = 0;
  nextPayment.paymentStatus =
    existingPayment.paymentStatus ?? existingPayment.payment_status ?? 'paid';
  nextPayment.payment_status = nextPayment.paymentStatus;

  if (sessionPayment && sessionPaymentAmountCents > 0) {
    if (!nextPayment.sessionPaymentMethod && !nextPayment.session_payment_method) {
      nextPayment.sessionPaymentMethod = sessionPayment.method;
      nextPayment.session_payment_method = sessionPayment.method;
    }
    if (
      !(
        Number(
          nextPayment.sessionPaymentAmountCents ?? nextPayment.session_payment_amount_cents ?? 0,
        ) > 0
      )
    ) {
      nextPayment.sessionPaymentAmountCents = sessionPaymentAmountCents;
      nextPayment.session_payment_amount_cents = sessionPaymentAmountCents;
    }
    const intentId = sessionPayment.stripePaymentIntentId?.trim();
    if (
      intentId &&
      !nextPayment.sessionPaymentStripeIntentId &&
      !nextPayment.session_payment_stripe_payment_intent_id
    ) {
      nextPayment.sessionPaymentStripeIntentId = intentId;
      nextPayment.session_payment_stripe_payment_intent_id = intentId;
    }
  }

  if (paidOnlineAmountCents > 0) {
    nextPayment.paidOnlineAmountCents = paidOnlineAmountCents;
    nextPayment.paid_online_amount_cents = paidOnlineAmountCents;
  }

  return {
    ...booking,
    payment: nextPayment,
    session_fee_lines: hasExistingLines ? existingLines : sessionFeeLines,
  };
}
