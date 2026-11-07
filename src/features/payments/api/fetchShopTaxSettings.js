import { supabase } from '../../../lib/supabase';

/**
 * Shop sales-tax switch and rate. One `payment_settings` row per business.
 * A missing row means tax is off. Does not create a row.
 *
 * @param {string} businessId
 * @returns {Promise<{ tax_enabled: boolean | null; tax_rate_bps: number | null } | null>}
 */
export async function fetchShopTaxSettings(businessId) {
  const { data, error } = await supabase
    .from('payment_settings')
    .select('tax_enabled, tax_rate_bps')
    .eq('business_id', businessId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message ?? 'Could not load tax settings');
  }

  return data ?? null;
}
