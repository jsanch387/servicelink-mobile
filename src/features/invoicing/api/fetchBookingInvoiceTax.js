import { supabase } from '../../../lib/supabase';

/**
 * Stored tax on the appointment an invoice is tied to.
 * A missing payment row is no tax, so the shop rate is not applied.
 *
 * @param {string} bookingId
 */
export async function fetchBookingInvoiceTax(bookingId) {
  const id = String(bookingId ?? '').trim();
  if (!id) return { found: false, taxCents: 0, taxRateBps: null };

  const { data, error } = await supabase
    .from('booking_payments')
    .select('tax_cents, tax_rate_bps')
    .eq('booking_id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return { found: false, taxCents: 0, taxRateBps: null };

  const taxCents = Math.max(0, Math.round(Number(data.tax_cents) || 0));
  const rate = Math.round(Number(data.tax_rate_bps));
  return {
    found: true,
    taxCents,
    taxRateBps: Number.isFinite(rate) && rate >= 1 ? rate : null,
  };
}
