import { parseSessionFeeLinesFromBooking } from './parseSessionFeeLinesFromBooking';
import { parseSessionFeesFromInvoiceSnapshot } from './parseSessionFeesFromInvoiceSnapshot';

/**
 * @param {{
 *   sessionFeeLines?: unknown;
 *   invoiceSnapshot?: unknown;
 *   paymentSummary?: {
 *     sessionFeesTotalCents?: number;
 *     totalAmountCents?: number;
 *   } | null;
 *   servicePrice?: number | null;
 *   addOnsTotal?: number;
 *   sessionPaymentAmountCents?: number;
 *   paidOnlineCents?: number;
 * }} params
 * @returns {Array<{ id: string; name: string; price: number }>}
 */
export function resolveBookingSessionFees({
  sessionFeeLines,
  invoiceSnapshot,
  paymentSummary,
  servicePrice,
  addOnsTotal = 0,
  sessionPaymentAmountCents = 0,
  paidOnlineCents = 0,
}) {
  let fees = parseSessionFeeLinesFromBooking(sessionFeeLines);
  if (fees.length === 0 && invoiceSnapshot) {
    fees = parseSessionFeesFromInvoiceSnapshot(invoiceSnapshot);
  }

  const sessionFeesTotalCents = Math.max(
    0,
    Math.round(Number(paymentSummary?.sessionFeesTotalCents ?? 0) || 0),
  );
  if (fees.length === 0 && sessionFeesTotalCents > 0) {
    fees = [
      {
        id: 'session-fees-total',
        name: 'Additional fees',
        price: sessionFeesTotalCents / 100,
      },
    ];
  }

  const baseCents =
    (Number.isFinite(servicePrice) ? Math.round(servicePrice * 100) : 0) +
    Math.round(Math.max(0, addOnsTotal) * 100);
  const baseDueCents = Math.max(0, baseCents - Math.max(0, Math.round(paidOnlineCents)));
  const sessionPaidCents = Math.max(0, Math.round(Number(sessionPaymentAmountCents ?? 0) || 0));
  if (fees.length === 0 && sessionPaidCents > baseDueCents) {
    const feeCents = sessionPaidCents - baseDueCents;
    if (feeCents > 0) {
      fees = [
        {
          id: 'inferred-session-fees',
          name: 'Additional fees',
          price: feeCents / 100,
        },
      ];
    }
  }

  const totalAmountCents = Math.max(
    0,
    Math.round(Number(paymentSummary?.totalAmountCents ?? 0) || 0),
  );
  const inferredCents = totalAmountCents - baseCents;
  if (fees.length === 0 && inferredCents > 0) {
    fees = [
      {
        id: 'inferred-session-fees',
        name: 'Additional fees',
        price: inferredCents / 100,
      },
    ];
  }

  return fees;
}
