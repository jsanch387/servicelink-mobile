import { supabase } from '../../../lib/supabase';
import { periodToSinceIso, resolveEffectiveLinkViewsPeriod } from '../utils/linkViewsPeriod';

/**
 * @param {string} businessProfileId
 * @param {'24h' | '7d' | '30d'} period
 * @param {boolean} hasProAccess
 * @returns {Promise<{ count: number; error: Error | null }>}
 */
export async function fetchLinkViewsCount(businessProfileId, period, hasProAccess) {
  if (!businessProfileId) {
    return { count: 0, error: null };
  }

  const effectivePeriod = resolveEffectiveLinkViewsPeriod(period, hasProAccess);
  const since = periodToSinceIso(effectivePeriod);

  const { count, error } = await supabase
    .from('public_analytics_events')
    .select('*', { count: 'exact', head: true })
    .eq('business_profile_id', businessProfileId)
    .eq('event_type', 'page_view')
    .gte('occurred_at', since);

  if (error) {
    return { count: 0, error };
  }

  return { count: count ?? 0, error: null };
}

/**
 * Newest page_view for the business (all time).
 *
 * @param {string} businessProfileId
 * @returns {Promise<{ lastViewedAt: string | null; error: Error | null }>}
 */
export async function fetchLinkViewsLastViewedAt(businessProfileId) {
  if (!businessProfileId) {
    return { lastViewedAt: null, error: null };
  }

  const { data, error } = await supabase
    .from('public_analytics_events')
    .select('occurred_at')
    .eq('business_profile_id', businessProfileId)
    .eq('event_type', 'page_view')
    .order('occurred_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return { lastViewedAt: null, error };
  }

  return { lastViewedAt: data?.occurred_at ?? null, error: null };
}
