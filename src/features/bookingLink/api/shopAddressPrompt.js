import { supabase } from '../../../lib/supabase';
import { needsLegacyShopAddressUpdate } from '../utils/needsLegacyShopAddressUpdate';

/**
 * @param {string} userId
 * @returns {Promise<{ businessProfileId: string | null, needsUpdate: boolean }>}
 */
export async function fetchShopAddressPromptStatus(userId) {
  if (!userId) {
    return { businessProfileId: null, needsUpdate: false };
  }

  const { data, error } = await supabase
    .from('business_profiles')
    .select('id, service_location_mode, shop_city, shop_state')
    .eq('profile_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message ?? 'Could not check shop address');
  }

  return {
    businessProfileId: data?.id ?? null,
    needsUpdate: needsLegacyShopAddressUpdate(data),
  };
}
