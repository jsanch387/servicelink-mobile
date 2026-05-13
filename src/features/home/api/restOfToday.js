import { supabase } from '../../../lib/supabase';
import { localYyyyMmDd } from '../utils/bookingStart';

/** Statuses shown on the home “today” timeline (chronological day view). */
const TODAY_TIMELINE_STATUSES = ['confirmed', 'completed', 'cancelled', 'canceled'];

/**
 * Fetch bookings for a local calendar day (confirmed, completed, and canceled).
 *
 * @param {string} businessId
 * @param {string} [calendarYyyyMmDd] - defaults to device-local today via {@link localYyyyMmDd}
 * @returns {Promise<{ data: object[] | null, error: Error | null }>}
 */
export async function fetchBookingsForTodayTimeline(
  businessId,
  calendarYyyyMmDd = localYyyyMmDd(),
) {
  const day = calendarYyyyMmDd;

  const { data, error } = await supabase
    .from('bookings')
    .select('id, scheduled_date, start_time, status, service_name')
    .eq('business_id', businessId)
    .in('status', TODAY_TIMELINE_STATUSES)
    .eq('scheduled_date', day)
    .order('start_time', { ascending: true });

  return { data, error };
}
