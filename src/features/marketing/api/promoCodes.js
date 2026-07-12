import { supabase } from '../../../lib/supabase';
import {
  campaignToPromoInsertPayload,
  mapPromoRowToCampaign,
  marketingErrorMessage,
} from '../utils/marketingDbMap';

const PROMO_SELECT = '*, promo_code_redemptions(count)';

/**
 * @param {string} businessId
 */
export async function fetchPromoCodesForBusiness(businessId) {
  const { data, error } = await supabase
    .from('promo_codes')
    .select(PROMO_SELECT)
    .eq('business_id', businessId)
    .order('created_at', { ascending: false });

  if (error) {
    return { data: null, error };
  }

  return {
    data: (data ?? []).map(mapPromoRowToCampaign),
    error: null,
  };
}

/**
 * @param {{ businessId: string; campaign: import('../utils/marketingCampaignModel').MarketingCampaign }} args
 */
export async function insertPromoCode({ businessId, campaign }) {
  const row = {
    business_id: businessId,
    ...campaignToPromoInsertPayload(campaign, { includeActive: true }),
  };

  const { data, error } = await supabase
    .from('promo_codes')
    .insert(row)
    .select(PROMO_SELECT)
    .single();

  if (error) {
    return { data: null, error: { ...error, message: marketingErrorMessage(error) } };
  }

  return { data: mapPromoRowToCampaign(data), error: null };
}

/**
 * @param {{ businessId: string; promoId: string; campaign: import('../utils/marketingCampaignModel').MarketingCampaign }} args
 */
export async function updatePromoCode({ businessId, promoId, campaign }) {
  const patch = {
    ...campaignToPromoInsertPayload(campaign, { includeActive: true }),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('promo_codes')
    .update(patch)
    .eq('id', promoId)
    .eq('business_id', businessId)
    .select(PROMO_SELECT)
    .single();

  if (error) {
    return { data: null, error: { ...error, message: marketingErrorMessage(error) } };
  }

  return { data: mapPromoRowToCampaign(data), error: null };
}

/**
 * @param {{ businessId: string; promoId: string; isActive: boolean }} args
 */
export async function togglePromoCodeActive({ businessId, promoId, isActive }) {
  const { data, error } = await supabase
    .from('promo_codes')
    .update({
      is_active: Boolean(isActive),
      updated_at: new Date().toISOString(),
    })
    .eq('id', promoId)
    .eq('business_id', businessId)
    .select(PROMO_SELECT)
    .single();

  if (error) {
    return { data: null, error };
  }

  return { data: mapPromoRowToCampaign(data), error: null };
}

/**
 * @param {{ businessId: string; promoId: string }} args
 */
export async function deletePromoCode({ businessId, promoId }) {
  const { error } = await supabase
    .from('promo_codes')
    .delete()
    .eq('id', promoId)
    .eq('business_id', businessId);

  return { error };
}
