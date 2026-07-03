import { supabase } from '../../../../lib/supabase';

/**
 * Updates an existing booking row. No emails or payment recalculation — data only.
 *
 * @param {string} bookingId
 * @param {Record<string, unknown>} payload snake_case columns for `bookings`
 * @param {string | null | undefined} [businessId] optional RLS scope
 */
export async function updateBookingById(bookingId, payload, businessId) {
  let query = supabase.from('bookings').update(payload).eq('id', bookingId);
  const scopedBusinessId = businessId?.trim();
  if (scopedBusinessId) {
    query = query.eq('business_id', scopedBusinessId);
  }

  const { data, error } = await query.select('id').maybeSingle();

  return { data, error };
}
