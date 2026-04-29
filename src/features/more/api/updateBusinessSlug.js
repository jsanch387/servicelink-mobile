import { supabase } from '../../../lib/supabase';
import { sanitizeBusinessSlugForSave } from '../utils/businessSlug';

/**
 * @param {{ userId: string; businessId: string; slugRaw: string }} args
 * @returns {Promise<void>}
 */
export async function updateBusinessSlug({ userId, businessId, slugRaw }) {
  const business_slug = sanitizeBusinessSlugForSave(slugRaw);
  if (!business_slug) {
    throw new Error('Enter a path for your booking link.');
  }

  const { error } = await supabase
    .from('business_profiles')
    .update({ business_slug })
    .eq('id', businessId)
    .eq('profile_id', userId);

  if (error) {
    throw new Error(error.message ?? 'Could not update link');
  }
}
