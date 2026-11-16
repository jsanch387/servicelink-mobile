import { supabase } from '../../../../lib/supabase';
import { resolveBookingPaymentTotals } from '../../utils/resolveBookingPaymentTotals';

/**
 * After an owner edits appointment prices, keep `booking_payments` aligned with the server.
 *
 * `visitTotalCents` is the pre-tax visit net (services + add-ons − booking discount).
 * Tax is recomputed from the frozen `tax_rate_bps`. The rate itself is not written.
 * Does not change paid-online amounts. Skips when no payment row exists.
 *
 * @param {string} bookingId
 * @param {number} visitTotalCents
 * @param {string | null | undefined} [businessId]
 */
export async function syncBookingPaymentTotalsAfterEdit(bookingId, visitTotalCents, businessId) {
  const id = String(bookingId ?? '').trim();
  if (!id) {
    return { error: new Error('Missing booking') };
  }

  const taxableBaseCents = Math.max(0, Math.round(Number(visitTotalCents) || 0));

  let read = supabase
    .from('booking_payments')
    .select(
      'id, paid_online_amount_cents, total_amount_cents, remaining_amount_cents, tax_cents, tax_rate_bps, session_fees_total_cents, session_discounts_total_cents, session_payment_amount_cents, payment_method_selected',
    )
    .eq('booking_id', id);
  const scopedBusinessId = businessId?.trim();
  if (scopedBusinessId) {
    read = read.eq('business_id', scopedBusinessId);
  }

  const { data: row, error: readError } = await read.maybeSingle();
  if (readError) {
    return { error: readError };
  }
  if (!row?.id) {
    return { data: null, error: null };
  }

  const isMembershipVisit =
    String(row.payment_method_selected ?? '')
      .trim()
      .toLowerCase() === 'membership';
  const next = resolveBookingPaymentTotals({
    taxableBaseCents,
    taxRateBps: row.tax_rate_bps,
    storedTaxCents: row.tax_cents,
    isMembershipVisit,
    sessionFeeCents: row.session_fees_total_cents,
    paidOnlineCents: row.paid_online_amount_cents,
    sessionDiscountCents: row.session_discounts_total_cents,
    sessionPaymentCents: row.session_payment_amount_cents,
  });

  const storedTax = Math.max(0, Math.round(Number(row.tax_cents) || 0));
  const storedTotal = Math.max(0, Math.round(Number(row.total_amount_cents) || 0));
  const storedRemaining = Math.max(0, Math.round(Number(row.remaining_amount_cents) || 0));
  if (
    storedTax === next.taxCents &&
    storedTotal === next.totalCents &&
    storedRemaining === next.remainingCents
  ) {
    return { data: row, error: null };
  }

  let write = supabase
    .from('booking_payments')
    .update({
      tax_cents: next.taxCents,
      total_amount_cents: next.totalCents,
      remaining_amount_cents: next.remainingCents,
    })
    .eq('id', row.id);
  if (scopedBusinessId) {
    write = write.eq('business_id', scopedBusinessId);
  }

  const { data, error } = await write.select('id').maybeSingle();
  return { data, error };
}
