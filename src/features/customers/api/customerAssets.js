import { supabase } from '../../../lib/supabase';

const CUSTOMER_ASSET_SELECT = 'id, asset_type, label, attributes, fingerprint, updated_at, created_at';

/**
 * @typedef {object} CustomerAssetRow
 * @property {string} id
 * @property {string} asset_type
 * @property {string} label
 * @property {Record<string, unknown> | null} [attributes]
 * @property {string} fingerprint
 * @property {string} [updated_at]
 * @property {string} [created_at]
 */

/**
 * Saved customer assets (vehicles, and later pets / property) for one CRM customer.
 *
 * @param {string} businessId
 * @param {string} customerId
 * @param {{ assetType?: string | null }} [options]
 * @returns {Promise<{ data: CustomerAssetRow[]; error: Error | null }>}
 */
export async function fetchCustomerAssetsForBusiness(businessId, customerId, options = {}) {
  const bid = String(businessId ?? '').trim();
  const cid = String(customerId ?? '').trim();
  if (!bid || !cid) {
    return { data: [], error: null };
  }

  let query = supabase
    .from('customer_assets')
    .select(CUSTOMER_ASSET_SELECT)
    .eq('business_id', bid)
    .eq('customer_id', cid)
    .order('updated_at', { ascending: false });

  const assetType = String(options.assetType ?? '').trim();
  if (assetType) {
    query = query.eq('asset_type', assetType);
  }

  const { data, error } = await query;
  if (error) {
    return { data: [], error };
  }
  return { data: Array.isArray(data) ? data : [], error: null };
}
