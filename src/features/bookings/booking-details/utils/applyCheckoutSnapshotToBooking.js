import {
  dollarsToCents,
  resolveSessionLineKind,
  resolveVisitServiceAndAddonCents,
} from './buildJobCompletedPayload';

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

  const sessionFeeLines = (checkout.sessionFees ?? []).flatMap((fee, index) => {
    const signedCents = dollarsToCents(fee?.amount);
    const amountCents = Math.abs(signedCents);
    if (amountCents === 0) {
      return [];
    }
    const kind = resolveSessionLineKind(fee?.kind, signedCents);
    return [
      {
        id: `checkout-fee-${index + 1}`,
        label:
          String(fee?.label ?? '').trim() ||
          `${kind === 'discount' ? 'Discount' : 'Fee'} ${index + 1}`,
        kind,
        amount_cents: amountCents,
        sort_order: index,
      },
    ];
  });
  const sessionFeesTotalCents = sessionFeeLines.reduce(
    (sum, line) => sum + (line.kind === 'fee' ? Number(line.amount_cents) || 0 : 0),
    0,
  );
  const sessionDiscountsTotalCents = sessionFeeLines.reduce(
    (sum, line) => sum + (line.kind === 'discount' ? Number(line.amount_cents) || 0 : 0),
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

  const { serviceCents, addonCents } = resolveVisitServiceAndAddonCents({
    servicePriceCents: booking.service_price_cents,
    addonDetails: booking.addon_details,
    jobDetails: booking.job_details,
  });

  const discountCents = Math.max(0, Math.round(Number(booking.discount_cents ?? 0) || 0));
  const snapshotTotalCents =
    Math.max(0, serviceCents + addonCents - discountCents) + sessionFeesTotalCents;
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

  const tipCents = Math.max(0, Math.round(Number(checkout.tipCents) || 0));
  if (tipCents > 0 && sessionPayment?.method === 'tap_to_pay') {
    nextPayment.tipCents = tipCents;
    nextPayment.tip_cents = tipCents;
  }

  if (sessionDiscountsTotalCents > 0) {
    nextPayment.sessionDiscountsTotalCents = Math.max(
      Number(
        existingPayment.sessionDiscountsTotalCents ??
          existingPayment.session_discounts_total_cents ??
          0,
      ) || 0,
      sessionDiscountsTotalCents,
    );
    nextPayment.session_discounts_total_cents = nextPayment.sessionDiscountsTotalCents;
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
