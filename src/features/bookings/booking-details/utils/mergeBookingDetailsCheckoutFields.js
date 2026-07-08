/**
 * Keeps checkout fees / session payment on booking details when a refetch returns sparse
 * Supabase rows (RLS or columns not projected) after Tap to Pay complete.
 *
 * @param {Record<string, unknown> | null | undefined} incoming
 * @param {Record<string, unknown> | null | undefined} previous
 * @returns {Record<string, unknown> | null | undefined}
 */
export function mergeBookingDetailsCheckoutFields(incoming, previous) {
  if (!incoming || typeof incoming !== 'object') {
    return incoming;
  }
  if (!previous || typeof previous !== 'object') {
    return incoming;
  }

  const next = { ...incoming };
  const prevLines = previous.session_fee_lines ?? previous.sessionFeeLines;
  const nextLines = next.session_fee_lines ?? next.sessionFeeLines;
  if (
    (!Array.isArray(nextLines) || nextLines.length === 0) &&
    Array.isArray(prevLines) &&
    prevLines.length > 0
  ) {
    next.session_fee_lines = prevLines;
  }

  if (!next.invoice_snapshot && !next.invoiceSnapshot) {
    const snapshot = previous.invoice_snapshot ?? previous.invoiceSnapshot;
    if (snapshot) {
      next.invoice_snapshot = snapshot;
    }
  }

  const prevPayment =
    previous.payment && typeof previous.payment === 'object' ? previous.payment : null;
  const nextPayment = next.payment && typeof next.payment === 'object' ? { ...next.payment } : null;
  if (prevPayment && nextPayment) {
    const pick = (camel, snake) => {
      const nextVal = nextPayment[camel] ?? nextPayment[snake];
      const prevVal = prevPayment[camel] ?? prevPayment[snake];
      if (typeof nextVal === 'string' && nextVal.trim()) {
        return nextVal;
      }
      if (typeof nextVal === 'number' && nextVal > 0) {
        return nextVal;
      }
      return prevVal;
    };

    next.payment = {
      ...nextPayment,
      sessionPaymentMethod: pick('sessionPaymentMethod', 'session_payment_method'),
      session_payment_method: pick('sessionPaymentMethod', 'session_payment_method'),
      sessionPaymentAmountCents: pick('sessionPaymentAmountCents', 'session_payment_amount_cents'),
      session_payment_amount_cents: pick(
        'sessionPaymentAmountCents',
        'session_payment_amount_cents',
      ),
      sessionPaymentStripeIntentId: pick(
        'sessionPaymentStripeIntentId',
        'session_payment_stripe_payment_intent_id',
      ),
      session_payment_stripe_payment_intent_id: pick(
        'sessionPaymentStripeIntentId',
        'session_payment_stripe_payment_intent_id',
      ),
      sessionFeesTotalCents: pick('sessionFeesTotalCents', 'session_fees_total_cents'),
      session_fees_total_cents: pick('sessionFeesTotalCents', 'session_fees_total_cents'),
      totalAmountCents: Math.max(
        Number(nextPayment.totalAmountCents ?? nextPayment.total_amount_cents ?? 0) || 0,
        Number(prevPayment.totalAmountCents ?? prevPayment.total_amount_cents ?? 0) || 0,
      ),
      total_amount_cents: Math.max(
        Number(nextPayment.totalAmountCents ?? nextPayment.total_amount_cents ?? 0) || 0,
        Number(prevPayment.totalAmountCents ?? prevPayment.total_amount_cents ?? 0) || 0,
      ),
    };
  } else if (prevPayment && !nextPayment) {
    next.payment = prevPayment;
  }

  return next;
}
