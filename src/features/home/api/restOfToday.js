import { supabase } from '../../../lib/supabase';
import { applyAssignedUserFilter } from '../../bookings/api/bookings';
import { localYyyyMmDd } from '../utils/bookingStart';

/** Statuses shown on the home “today” timeline (chronological day view). */
const TODAY_TIMELINE_STATUSES = ['confirmed', 'completed', 'cancelled', 'canceled'];

/**
 * Fetch bookings for a local calendar day (confirmed, completed, and canceled).
 *
 * @param {string} businessId
 * @param {string} [calendarYyyyMmDd] - defaults to device-local today via {@link localYyyyMmDd}
 * @param {{ assignedUserId?: string | null; includeUnassigned?: boolean }} [options]
 *   when `assignedUserId` is set, only that person's jobs (plus unassigned if asked)
 * @returns {Promise<{ data: object[] | null, error: Error | null }>}
 */
export async function fetchBookingsForTodayTimeline(
  businessId,
  calendarYyyyMmDd = localYyyyMmDd(),
  options = {},
) {
  const day = calendarYyyyMmDd;

  const { data, error } = await applyAssignedUserFilter(
    supabase
      .from('bookings')
      .select(
        `
        id,
        scheduled_date,
        start_time,
        status,
        assigned_user_id,
        service_name,
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
          remaining_amount_cents
        )
      `,
      )
      .eq('business_id', businessId)
      .in('status', TODAY_TIMELINE_STATUSES)
      .eq('scheduled_date', day),
    options.assignedUserId,
    { includeUnassigned: options.includeUnassigned },
  ).order('start_time', { ascending: true });

  return { data, error };
}
