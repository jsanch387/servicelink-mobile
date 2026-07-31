import { supabase } from '../../../lib/supabase';

const COMPLETED_BOOKING_PAYMENTS_SELECT = `
  id,
  scheduled_date,
  start_time,
  status,
  service_name,
  customer_name,
  job_details,
  visit_job_count,
  service_price_cents,
  addon_details,
  subtotal_cents,
  discount_cents,
  booking_payments (
    total_amount_cents,
    paid_online_amount_cents,
    session_fees_total_cents,
    session_payment_amount_cents,
    remaining_amount_cents,
    session_payment_method,
    session_payment_recorded_at
  )
`;

/**
 * Completed appointments (+ payment row) for revenue / activity.
 * Optional inclusive `scheduled_date` window (`YYYY-MM-DD`).
 *
 * @param {{
 *   businessId: string;
 *   fromYmd?: string | null;
 *   toYmd?: string | null;
 * }} args
 * @returns {Promise<{ data: object[] | null; error: Error | null }>}
 */
export async function fetchCompletedBookingPayments({ businessId, fromYmd = null, toYmd = null }) {
  if (!businessId) {
    return { data: [], error: null };
  }

  let query = supabase
    .from('bookings')
    .select(COMPLETED_BOOKING_PAYMENTS_SELECT)
    .eq('business_id', businessId)
    .eq('status', 'completed')
    .order('scheduled_date', { ascending: true })
    .order('start_time', { ascending: true });

  if (fromYmd) {
    query = query.gte('scheduled_date', fromYmd);
  }
  if (toYmd) {
    query = query.lte('scheduled_date', toYmd);
  }

  const { data, error } = await query;
  return { data: data ?? [], error };
}
