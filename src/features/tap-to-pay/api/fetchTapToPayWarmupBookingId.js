import { supabase } from '../../../lib/supabase';

/**
 * Any recent booking owned by the business — used only to scope warm-up
 * connection-token requests when the merchant API is not deployed yet.
 *
 * @param {string} businessId
 * @returns {Promise<string | null>}
 */
export async function fetchTapToPayWarmupBookingId(businessId) {
  if (!businessId?.trim()) {
    return null;
  }

  const { data, error } = await supabase
    .from('bookings')
    .select('id')
    .eq('business_id', businessId.trim())
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return null;
  }

  const id = typeof data?.id === 'string' ? data.id.trim() : '';
  return id || null;
}
