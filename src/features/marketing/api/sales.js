import { supabase } from '../../../lib/supabase';
import {
  campaignToSaleInsertPayload,
  mapSaleRowToCampaign,
  marketingErrorMessage,
} from '../utils/marketingDbMap';

/**
 * @param {string} businessId
 */
export async function fetchSalesForBusiness(businessId) {
  const { data, error } = await supabase
    .from('sales')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false });

  if (error) {
    return { data: null, error };
  }

  return {
    data: (data ?? []).map(mapSaleRowToCampaign),
    error: null,
  };
}

/**
 * Deactivate every active sale for the business (except optional keepId).
 * @param {{ businessId: string; exceptSaleId?: string | null }} args
 */
export async function deactivateOtherActiveSales({ businessId, exceptSaleId = null }) {
  let query = supabase
    .from('sales')
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('business_id', businessId)
    .eq('is_active', true);

  if (exceptSaleId) {
    query = query.neq('id', exceptSaleId);
  }

  const { error } = await query;
  return { error };
}

/**
 * @param {{ businessId: string; campaign: import('../utils/marketingCampaignModel').MarketingCampaign }} args
 */
export async function insertSale({ businessId, campaign }) {
  const wantsActive = campaign.isEnabled !== false;
  if (wantsActive) {
    const { error: deactivateError } = await deactivateOtherActiveSales({ businessId });
    if (deactivateError) {
      return { data: null, error: deactivateError };
    }
  }

  const row = {
    business_id: businessId,
    ...campaignToSaleInsertPayload(campaign, { includeActive: true }),
  };

  const { data, error } = await supabase.from('sales').insert(row).select('*').single();

  if (error) {
    return { data: null, error: { ...error, message: marketingErrorMessage(error) } };
  }

  return { data: mapSaleRowToCampaign(data), error: null };
}

/**
 * @param {{ businessId: string; saleId: string; campaign: import('../utils/marketingCampaignModel').MarketingCampaign }} args
 */
export async function updateSale({ businessId, saleId, campaign }) {
  const wantsActive = campaign.isEnabled !== false;
  if (wantsActive) {
    const { error: deactivateError } = await deactivateOtherActiveSales({
      businessId,
      exceptSaleId: saleId,
    });
    if (deactivateError) {
      return { data: null, error: deactivateError };
    }
  }

  const patch = {
    ...campaignToSaleInsertPayload(campaign, { includeActive: true }),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('sales')
    .update(patch)
    .eq('id', saleId)
    .eq('business_id', businessId)
    .select('*')
    .single();

  if (error) {
    return { data: null, error: { ...error, message: marketingErrorMessage(error) } };
  }

  return { data: mapSaleRowToCampaign(data), error: null };
}

/**
 * @param {{ businessId: string; saleId: string; isActive: boolean }} args
 */
export async function toggleSaleActive({ businessId, saleId, isActive }) {
  if (isActive) {
    const { error: deactivateError } = await deactivateOtherActiveSales({
      businessId,
      exceptSaleId: saleId,
    });
    if (deactivateError) {
      return { data: null, error: deactivateError };
    }
  }

  const { data, error } = await supabase
    .from('sales')
    .update({
      is_active: Boolean(isActive),
      updated_at: new Date().toISOString(),
    })
    .eq('id', saleId)
    .eq('business_id', businessId)
    .select('*')
    .single();

  if (error) {
    return { data: null, error };
  }

  return { data: mapSaleRowToCampaign(data), error: null };
}

/**
 * @param {{ businessId: string; saleId: string }} args
 */
export async function deleteSale({ businessId, saleId }) {
  const { error } = await supabase
    .from('sales')
    .delete()
    .eq('id', saleId)
    .eq('business_id', businessId);

  return { error };
}
