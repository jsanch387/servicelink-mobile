import { supabase } from '../../../lib/supabase';

/**
 * @param {string} userId - auth user id (`profiles.user_id`)
 * @returns {Promise<{ ownerProfile: Record<string, unknown> | null; business: { id: string; business_slug: string | null } | null; error: Error | null }>}
 */
export async function fetchAccountSettingsBundle(userId) {
  if (!userId) {
    return { ownerProfile: null, business: null, error: new Error('Not signed in') };
  }

  const [ownerRes, businessRes] = await Promise.all([
    supabase
      .from('profiles')
      .select(
        [
          'subscription_tier',
          'subscription_status',
          'subscription_current_period_end',
          'subscription_cancel_at_period_end',
          'stripe_subscription_id',
          'stripe_customer_id',
        ].join(', '),
      )
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('business_profiles')
      .select('id, business_slug')
      .eq('profile_id', userId)
      .maybeSingle(),
  ]);

  if (ownerRes.error) {
    return {
      ownerProfile: null,
      business: null,
      error: new Error(ownerRes.error.message ?? 'Could not load profile'),
    };
  }
  if (businessRes.error) {
    return {
      ownerProfile: null,
      business: null,
      error: new Error(businessRes.error.message ?? 'Could not load business'),
    };
  }

  const business = businessRes.data?.id
    ? { id: String(businessRes.data.id), business_slug: businessRes.data.business_slug ?? null }
    : null;

  return {
    ownerProfile: ownerRes.data ?? null,
    business,
    error: null,
  };
}
