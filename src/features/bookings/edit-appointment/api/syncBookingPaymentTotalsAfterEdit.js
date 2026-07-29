import { supabase } from '../../../../lib/supabase';

/**
 * After an owner edits appointment prices, keep `booking_payments` total/remaining
 * aligned with the new visit amount so Payment due matches Visit total.
 *
 * Does not change paid-online amounts. Skips when no payment row exists.
 *
 * @param {string} bookingId
 * @param {number} visitTotalCents service + add-ons − discount (+ explicit fees if included by caller)
 * @param {string | null | undefined} [businessId]
 */
export async function syncBookingPaymentTotalsAfterEdit(bookingId, visitTotalCents, businessId) {
  const id = String(bookingId ?? '').trim();
  if (!id) {
    return { error: new Error('Missing booking') };
  }

  const totalCents = Math.max(0, Math.round(Number(visitTotalCents) || 0));

  let read = supabase
    .from('booking_payments')
    .select('id, paid_online_amount_cents, total_amount_cents, remaining_amount_cents')
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

  const paidOnline = Math.max(0, Math.round(Number(row.paid_online_amount_cents) || 0));
  const remainingCents = Math.max(0, totalCents - paidOnline);

  if (
    Math.max(0, Math.round(Number(row.total_amount_cents) || 0)) === totalCents &&
    Math.max(0, Math.round(Number(row.remaining_amount_cents) || 0)) === remainingCents
  ) {
    return { data: row, error: null };
  }

  let write = supabase
    .from('booking_payments')
    .update({
      total_amount_cents: totalCents,
      remaining_amount_cents: remainingCents,
    })
    .eq('id', row.id);
  if (scopedBusinessId) {
    write = write.eq('business_id', scopedBusinessId);
  }

  const { data, error } = await write.select('id').maybeSingle();
  return { data, error };
}
