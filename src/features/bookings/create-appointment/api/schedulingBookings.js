import { supabase } from '../../../../lib/supabase';

const BLOCKING_STATUSES = ['confirmed', 'completed'];

/**
 * Bookings that occupy the schedule (same idea as web blocked-slots API).
 *
 * @param {string} businessId
 * @param {string} fromYyyyMmDd
 * @param {string} toYyyyMmDd
 * @returns {Promise<{ data: Record<string, unknown>[] | null; error: Error | null }>}
 */
export async function fetchBlockingBookingsInRange(businessId, fromYyyyMmDd, toYyyyMmDd) {
  if (!businessId || !fromYyyyMmDd || !toYyyyMmDd) {
    return { data: [], error: null };
  }

  const { data, error } = await supabase
    .from('bookings')
    .select('scheduled_date, start_time, duration_minutes, status')
    .eq('business_id', businessId)
    .in('status', BLOCKING_STATUSES)
    .gte('scheduled_date', fromYyyyMmDd)
    .lte('scheduled_date', toYyyyMmDd);

  return { data, error: error ?? null };
}
