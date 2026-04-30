import { supabase } from '../../../../lib/supabase';

/**
 * Active multi-price rows for a service (Pro + `price_options_enabled` flow).
 *
 * @param {string} businessId
 * @param {string} serviceId
 * @returns {Promise<{ data: Record<string, unknown>[]; error: Error | null }>}
 */
export async function fetchActivePriceOptionsForService(businessId, serviceId) {
  if (!businessId || !serviceId) {
    return { data: [], error: null };
  }

  const { data, error } = await supabase
    .from('service_price_options')
    .select('*')
    .eq('business_id', businessId)
    .eq('service_id', serviceId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  return { data: data ?? [], error: error ?? null };
}
