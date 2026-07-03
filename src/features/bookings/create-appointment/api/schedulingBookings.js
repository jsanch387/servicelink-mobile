import { supabase } from '../../../../lib/supabase';

const BLOCKING_STATUSES = ['confirmed', 'completed'];

/**
 * Bookings that occupy the schedule (same idea as web blocked-slots API).
 *
 * @param {string} businessId
 * @param {string} fromYyyyMmDd
 * @param {string} toYyyyMmDd
 * @param {string | null | undefined} [excludeBookingId] omit one booking (e.g. while editing its schedule)
 * @returns {Promise<{ data: Record<string, unknown>[] | null; error: Error | null }>}
 */
export async function fetchBlockingBookingsInRange(
  businessId,
  fromYyyyMmDd,
  toYyyyMmDd,
  excludeBookingId,
) {
  if (!businessId || !fromYyyyMmDd || !toYyyyMmDd) {
    return { data: [], error: null };
  }

  let query = supabase
    .from('bookings')
    .select('id, scheduled_date, start_time, duration_minutes, status')
    .eq('business_id', businessId)
    .in('status', BLOCKING_STATUSES)
    .gte('scheduled_date', fromYyyyMmDd)
    .lte('scheduled_date', toYyyyMmDd);

  const excludeId = String(excludeBookingId ?? '').trim();
  if (excludeId) {
    query = query.neq('id', excludeId);
  }

  const { data, error } = await query;

  return { data, error: error ?? null };
}
