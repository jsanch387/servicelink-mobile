import { supabase } from '../../../../lib/supabase';

export const BOOKING_DETAILS_SELECT = [
  'id',
  'status',
  'scheduled_date',
  'start_time',
  'duration_minutes',
  'service_name',
  'service_id',
  'service_price_cents',
  'addon_details',
  'customer_name',
  'customer_phone',
  'customer_email',
  'customer_id',
  'customer_street_address',
  'customer_unit_apt',
  'customer_city',
  'customer_state',
  'customer_zip',
  'customer_vehicle_year',
  'customer_vehicle_make',
  'customer_vehicle_model',
  'customer_notes',
].join(', ');

const BOOKING_PAYMENTS_SELECT = [
  'payment_status',
  'payment_method_selected',
  'currency',
  'total_amount_cents',
  'paid_online_amount_cents',
  'remaining_amount_cents',
].join(', ');

/**
 * Maps a `booking_payments` row to the same camelCase shape the web dashboard uses
 * (`BookingPaymentSummaryDisplay`).
 *
 * @param {Record<string, unknown> | null | undefined} row
 */
export function mapBookingPaymentRowToSummary(row) {
  if (!row) {
    return undefined;
  }
  return {
    paymentStatus: row.payment_status ?? 'not_required',
    paymentMethodSelected: String(row.payment_method_selected ?? 'none'),
    currency:
      String(row.currency ?? 'usd')
        .trim()
        .toLowerCase() || 'usd',
    totalAmountCents: Math.max(0, Math.round(Number(row.total_amount_cents ?? 0) || 0)),
    paidOnlineAmountCents: Math.max(0, Math.round(Number(row.paid_online_amount_cents ?? 0) || 0)),
    remainingAmountCents: Math.max(0, Math.round(Number(row.remaining_amount_cents ?? 0) || 0)),
  };
}

/**
 * @param {string} bookingId
 */
export async function fetchBookingDetailsById(bookingId) {
  const bookingQuery = supabase
    .from('bookings')
    .select(BOOKING_DETAILS_SELECT)
    .eq('id', bookingId)
    .maybeSingle();

  const paymentQuery = supabase
    .from('booking_payments')
    .select(BOOKING_PAYMENTS_SELECT)
    .eq('booking_id', bookingId)
    .maybeSingle();

  const [{ data: booking, error: bookingError }, { data: payRow, error: payError }] =
    await Promise.all([bookingQuery, paymentQuery]);

  if (bookingError) {
    return { data: null, error: bookingError };
  }
  if (!booking) {
    return { data: null, error: null };
  }

  // If the payments row cannot be read (RLS, missing table), still show booking details without Payment.
  const payment = payError ? undefined : mapBookingPaymentRowToSummary(payRow);
  const merged = payment !== undefined ? { ...booking, payment } : { ...booking };

  return { data: merged, error: null };
}

/**
 * @param {string} bookingId
 * @param {string | null | undefined} [businessId]
 */
export async function markBookingCompletedById(bookingId, businessId) {
  let query = supabase.from('bookings').update({ status: 'completed' }).eq('id', bookingId);
  const scopedBusinessId = businessId?.trim();
  if (scopedBusinessId) {
    query = query.eq('business_id', scopedBusinessId);
  }

  const { data, error } = await query.select('id, status').maybeSingle();

  return { data, error };
}

/**
 * @param {string} bookingId
 */
export async function cancelBookingById(bookingId) {
  const { data, error } = await supabase
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', bookingId)
    .select('id, status')
    .maybeSingle();

  return { data, error };
}

/**
 * Permanently deletes the booking row. Does not delete CRM `customers` rows (bookings only store
 * snapshot fields on the row). Removes `booking_payments` first when present so FK constraints
 * do not block the booking delete.
 *
 * @param {string} bookingId
 */
export async function deleteBookingById(bookingId) {
  const { error: paymentDeleteError } = await supabase
    .from('booking_payments')
    .delete()
    .eq('booking_id', bookingId);

  if (paymentDeleteError) {
    return { data: null, error: paymentDeleteError };
  }

  const { data, error } = await supabase
    .from('bookings')
    .delete()
    .eq('id', bookingId)
    .select('id')
    .maybeSingle();

  return { data, error };
}

/**
 * @param {string} bookingId
 * @param {{ scheduledDate: string; startTime: string }} payload
 */
export async function rescheduleBookingById(bookingId, payload) {
  const { data, error } = await supabase
    .from('bookings')
    .update({
      scheduled_date: payload.scheduledDate,
      start_time: payload.startTime,
    })
    .eq('id', bookingId)
    .select('id, scheduled_date, start_time')
    .maybeSingle();

  return { data, error };
}
