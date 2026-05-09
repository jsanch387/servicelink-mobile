import { supabase } from '../../../lib/supabase';
import { quotesDebugError, quotesFormatSupabaseError } from '../utils/quotesDebug';

/**
 * Owner: whether the public booking link shows “request a quote” and accepts inbound quote requests.
 *
 * @param {string} businessId - `business_profiles.id`
 * @param {boolean} acceptQuoteReq
 * @returns {Promise<{ error: Error | null }>}
 */
export async function updateAcceptQuoteRequests(businessId, acceptQuoteReq) {
  const { error } = await supabase
    .from('business_profiles')
    .update({ accept_quote_req: acceptQuoteReq })
    .eq('id', businessId);

  if (error) {
    quotesDebugError('updateAcceptQuoteRequests:failed', error.message ?? 'unknown', {
      businessId,
      formatted: quotesFormatSupabaseError(error),
    });
  }

  return { error: error ?? null };
}
