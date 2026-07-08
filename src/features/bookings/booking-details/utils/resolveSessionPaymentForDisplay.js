/**
 * @param {Record<string, unknown> | null | undefined} payment
 * @param {string | null | undefined} bookingStatus
 * @param {string | null | undefined} [jobStatus]
 */
export function resolveSessionPaymentForDisplay(payment, bookingStatus, jobStatus) {
  if (!payment) {
    return {
      sessionMethod: '',
      sessionPaidCents: 0,
      paidOnlineCents: 0,
    };
  }

  const statusLower = String(bookingStatus ?? '')
    .trim()
    .toLowerCase();
  const jobStatusLower = String(jobStatus ?? '')
    .trim()
    .toLowerCase();
  const isCompleted =
    statusLower === 'completed' || statusLower === 'complete' || jobStatusLower === 'completed';
  const paymentStatus = String(payment.paymentStatus ?? '')
    .trim()
    .toLowerCase();
  const method = String(payment.paymentMethodSelected ?? '')
    .trim()
    .toLowerCase();
  const paidOnline = Math.max(0, Math.round(Number(payment.paidOnlineAmountCents ?? 0) || 0));
  const rem = Math.max(0, Math.round(Number(payment.remainingAmountCents ?? 0) || 0));
  const total = Math.max(0, Math.round(Number(payment.totalAmountCents ?? 0) || 0));
  const isSettled =
    rem <= 0 && (paymentStatus === 'paid' || paymentStatus === 'paid_full' || isCompleted);

  let sessionMethod = String(payment.sessionPaymentMethod ?? '')
    .trim()
    .toLowerCase();
  let sessionPaid = Math.max(0, Math.round(Number(payment.sessionPaymentAmountCents ?? 0) || 0));
  const stripeIntent = String(
    payment.sessionPaymentStripeIntentId ?? payment.session_payment_stripe_payment_intent_id ?? '',
  ).trim();

  if (stripeIntent) {
    sessionMethod = sessionMethod || 'tap_to_pay';
    if (sessionPaid <= 0) {
      sessionPaid = total > 0 ? total : paidOnline;
    }
  }

  if (
    !sessionMethod &&
    isCompleted &&
    isSettled &&
    paidOnline > 0 &&
    method !== 'pay_now' &&
    sessionPaid <= 0
  ) {
    sessionMethod = 'tap_to_pay';
    sessionPaid = paidOnline;
    return {
      sessionMethod,
      sessionPaidCents: sessionPaid,
      paidOnlineCents: 0,
    };
  }

  if (
    !sessionMethod &&
    isCompleted &&
    rem <= 0 &&
    total > 0 &&
    paidOnline <= 0 &&
    sessionPaid <= 0
  ) {
    sessionMethod = 'tap_to_pay';
    sessionPaid = total;
    return {
      sessionMethod,
      sessionPaidCents: sessionPaid,
      paidOnlineCents: 0,
    };
  }

  if (!sessionMethod && sessionPaid > 0) {
    sessionMethod = 'tap_to_pay';
  }

  return {
    sessionMethod,
    sessionPaidCents: sessionPaid,
    paidOnlineCents: paidOnline,
  };
}
