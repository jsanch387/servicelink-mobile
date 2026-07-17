import { parseAddonLineItemsFromBooking } from '../../bookings/booking-details/utils/parseAddonLineItemsFromBooking';

const EARNINGS_STATUSES = new Set(['confirmed', 'completed']);

function cents(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0;
}

function hasCentsValue(value) {
  return value !== null && value !== undefined && Number.isFinite(Number(value));
}

function firstPayment(row) {
  if (Array.isArray(row?.booking_payments)) {
    return row.booking_payments[0] ?? null;
  }
  return row?.booking_payments ?? null;
}

function addonTotalCents(addonDetails) {
  return parseAddonLineItemsFromBooking(addonDetails).reduce(
    (total, addon) => total + cents(addon.price * 100),
    0,
  );
}

/**
 * Resolve booked, collected, and remaining cents for one scheduled job.
 * Booking snapshots are authoritative for discounts; payment totals remain the fallback
 * for legacy rows without a usable price snapshot.
 */
export function computeBookingEarningsCents(row) {
  const status = String(row?.status ?? '')
    .trim()
    .toLowerCase();
  if (!EARNINGS_STATUSES.has(status)) {
    return null;
  }

  const payment = firstPayment(row);
  const serviceCents = cents(row?.service_price_cents);
  const addonsCents = addonTotalCents(row?.addon_details);
  const hasBookingPrice =
    hasCentsValue(row?.subtotal_cents) ||
    hasCentsValue(row?.service_price_cents) ||
    addonsCents > 0;
  const grossCents = hasCentsValue(row?.subtotal_cents)
    ? cents(row.subtotal_cents)
    : serviceCents + addonsCents;
  const discountCents = Math.min(cents(row?.discount_cents), grossCents);
  const feesCents = cents(payment?.session_fees_total_cents);
  const computedTotalCents = Math.max(grossCents - discountCents + feesCents, 0);
  const paymentTotalCents = cents(payment?.total_amount_cents);

  let resolvedTotalCents = hasBookingPrice ? computedTotalCents : paymentTotalCents;
  if (paymentTotalCents > 0) {
    const paymentNeedsDiscountCorrection =
      hasBookingPrice && discountCents > 0 && paymentTotalCents !== computedTotalCents;
    const paymentMissingFees =
      hasBookingPrice && feesCents > 0 && paymentTotalCents < computedTotalCents;
    if (!paymentNeedsDiscountCorrection && !paymentMissingFees) {
      resolvedTotalCents = paymentTotalCents;
    }
  }

  const explicitCollectedCents =
    cents(payment?.paid_online_amount_cents) + cents(payment?.session_payment_amount_cents);
  const potentialCents = Math.max(resolvedTotalCents, explicitCollectedCents);
  const collectedCents = Math.min(explicitCollectedCents, potentialCents);

  return {
    potentialCents,
    collectedCents,
    remainingCents: Math.max(potentialCents - collectedCents, 0),
  };
}

export function computeTodaysEarnings(rows) {
  return (rows ?? []).reduce(
    (summary, row) => {
      const earnings = computeBookingEarningsCents(row);
      if (!earnings) {
        return summary;
      }
      return {
        jobCount: summary.jobCount + 1,
        potentialCents: summary.potentialCents + earnings.potentialCents,
        collectedCents: summary.collectedCents + earnings.collectedCents,
        remainingCents: summary.remainingCents + earnings.remainingCents,
      };
    },
    {
      jobCount: 0,
      potentialCents: 0,
      collectedCents: 0,
      remainingCents: 0,
    },
  );
}
