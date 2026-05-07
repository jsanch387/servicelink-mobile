import { supabase } from '../../../lib/supabase';
import { getBookingLinkDisplay } from '../../home/utils/bookingLink';
import { sanitizeBusinessSlugForSave } from '../utils/businessSlug';

/**
 * Ensures no other business row owns this slug (same business may keep its current slug).
 *
 * @param {string} businessSlug
 * @param {string} excludeBusinessId
 */
async function assertBusinessSlugAvailable(businessSlug, excludeBusinessId) {
  const { data, error } = await supabase
    .from('business_profiles')
    .select('id')
    .eq('business_slug', businessSlug)
    .neq('id', excludeBusinessId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message ?? 'Could not verify link availability.');
  }
  if (data?.id) {
    throw new Error('That link is already taken. Try another.');
  }
}

/**
 * @param {{ userId: string; businessId: string; slugRaw: string }} args
 * @returns {Promise<void>}
 */
export async function updateBusinessSlug({ userId, businessId, slugRaw }) {
  const business_slug = sanitizeBusinessSlugForSave(slugRaw);
  if (!business_slug) {
    throw new Error('Enter a path for your booking link.');
  }

  await assertBusinessSlugAvailable(business_slug, businessId);

  /** Stored like `myservicelink.app/your-slug` (no scheme). */
  const business_link = getBookingLinkDisplay(business_slug);

  const { error } = await supabase
    .from('business_profiles')
    .update({ business_slug, business_link })
    .eq('id', businessId)
    .eq('profile_id', userId);

  if (error) {
    const code = error.code ?? '';
    if (code === '23505') {
      throw new Error('That link is already taken. Try another.');
    }
    throw new Error(error.message ?? 'Could not update link');
  }
}
