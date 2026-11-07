import { parseSessionFeeLinesFromBooking } from './parseSessionFeeLinesFromBooking';
import { parseSessionFeesFromInvoiceSnapshot } from './parseSessionFeesFromInvoiceSnapshot';

/**
 * @param {{
 *   sessionFeeLines?: unknown;
 *   invoiceSnapshot?: unknown;
 *   paymentSummary?: {
 *     sessionFeesTotalCents?: number;
 *     sessionDiscountsTotalCents?: number;
 *     totalAmountCents?: number;
 *     taxCents?: number;
 *   } | null;
 *   servicePrice?: number | null;
 *   addOnsTotal?: number;
 *   discountDollars?: number;
 *   sessionPaymentAmountCents?: number;
 *   paidOnlineCents?: number;
 * }} params
 * @returns {Array<{ id: string; name: string; price: number; kind: 'fee' | 'discount' }>}
 */
export function resolveBookingSessionFees({
  sessionFeeLines,
  invoiceSnapshot,
  paymentSummary,
  servicePrice,
  addOnsTotal = 0,
  discountDollars = 0,
  sessionPaymentAmountCents = 0,
  paidOnlineCents = 0,
}) {
  let fees = parseSessionFeeLinesFromBooking(sessionFeeLines);
  if (fees.length === 0 && invoiceSnapshot) {
    fees = parseSessionFeesFromInvoiceSnapshot(invoiceSnapshot);
  }

  const discountCents = Math.max(0, Math.round(Number(discountDollars) * 100) || 0);
  const serviceCents = Number.isFinite(servicePrice) ? Math.round(servicePrice * 100) : 0;
  const addonCents = Math.round(Math.max(0, addOnsTotal) * 100);
  const grossBaseCents = serviceCents + addonCents;
  const baseCents = Math.max(0, grossBaseCents - discountCents);
  const baseDueCents = Math.max(0, baseCents - Math.max(0, Math.round(paidOnlineCents)));
  const taxCents = Math.max(0, Math.round(Number(paymentSummary?.taxCents ?? 0) || 0));
  const totalAmountCents = Math.max(
    0,
    Math.round(Number(paymentSummary?.totalAmountCents ?? 0) || 0),
  );
  const sessionFeesTotalCents = Math.max(
    0,
    Math.round(Number(paymentSummary?.sessionFeesTotalCents ?? 0) || 0),
  );
  const sessionDiscountsTotalCents = Math.max(
    0,
    Math.round(Number(paymentSummary?.sessionDiscountsTotalCents ?? 0) || 0),
  );
  const storedFeeTotalIsTax =
    taxCents > 0 && sessionFeesTotalCents === taxCents && totalAmountCents === baseCents + taxCents;
  if (fees.length === 0 && sessionFeesTotalCents > 0 && !storedFeeTotalIsTax) {
    fees = [
      {
        id: 'session-fees-total',
        name: 'Additional fees',
        price: sessionFeesTotalCents / 100,
        kind: 'fee',
      },
    ];
  }

  const sessionPaidCents = Math.max(0, Math.round(Number(sessionPaymentAmountCents ?? 0) || 0));
  const tipCents = Math.max(
    0,
    Math.round(Number(paymentSummary?.tipCents ?? paymentSummary?.tip_cents ?? 0) || 0),
  );
  // The card charge includes the tip. That overage is not an extra fee.
  const collectedTowardVisitCents = Math.max(0, sessionPaidCents - tipCents);
  if (fees.length === 0 && collectedTowardVisitCents > baseDueCents) {
    const gapCents = collectedTowardVisitCents - baseDueCents;
    // Session collected the pre-discount gross — gap is the discount, not a fee.
    // Tax is already its own line, so it is not an additional fee either.
    if (!(discountCents > 0 && gapCents === discountCents)) {
      const feeCents = gapCents - taxCents;
      if (feeCents > 0) {
        fees = [
          {
            id: 'inferred-session-fees',
            name: 'Additional fees',
            price: feeCents / 100,
            kind: 'fee',
          },
        ];
      }
    }
  }

  const inferredCents = totalAmountCents - baseCents - taxCents;
  if (fees.length === 0 && inferredCents > 0) {
    const paymentLooksPreDiscount =
      discountCents > 0 && (totalAmountCents === grossBaseCents || inferredCents === discountCents);
    if (!paymentLooksPreDiscount) {
      fees = [
        {
          id: 'inferred-session-fees',
          name: 'Additional fees',
          price: inferredCents / 100,
          kind: 'fee',
        },
      ];
    }
  }

  if (sessionDiscountsTotalCents > 0 && !fees.some((item) => item.kind === 'discount')) {
    fees = [
      ...fees,
      {
        id: 'session-discounts-total',
        name: 'Discount',
        price: sessionDiscountsTotalCents / 100,
        kind: 'discount',
      },
    ];
  }

  return fees.map((item) => ({
    ...item,
    kind: item.kind === 'discount' ? 'discount' : 'fee',
  }));
}
