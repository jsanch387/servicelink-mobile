import { supabase } from '../../../lib/supabase';
import { quotesDebugError, quotesDebugWarn, quotesFormatSupabaseError } from '../utils/quotesDebug';

/**
 * Owner-visible columns — align with prod `quotes` (not identical to `bookings`).
 * Quotes use `scheduled_start_time`, not `start_time`.
 */
export const QUOTE_OWNER_LIST_COLUMNS =
  'id, business_id, status, source, customer_name, customer_email, customer_phone, vehicle_year, vehicle_make, vehicle_model, request_message, service_name, price_cents, duration_minutes, scheduled_date, scheduled_start_time, updated_at, created_at';

/**
 * @param {string} businessId - `business_profiles.id`
 * @returns {Promise<{ data: object[] | null; error: Error | null }>}
 */
export async function fetchQuotesForBusiness(businessId) {
  const { data, error } = await supabase
    .from('quotes')
    .select(QUOTE_OWNER_LIST_COLUMNS)
    .eq('business_id', businessId)
    .order('updated_at', { ascending: false });

  if (error) {
    quotesDebugError('fetchQuotesForBusiness:failed', error.message ?? 'unknown', {
      formatted: quotesFormatSupabaseError(error),
      businessId,
    });
  }

  return { data, error };
}

/**
 * @param {string} businessId
 * @param {string} quoteId
 * @returns {Promise<{ data: object | null; error: Error | null }>}
 */
export async function fetchQuoteByIdForBusiness(businessId, quoteId) {
  const id = String(quoteId ?? '').trim();

  if (!id) {
    return { data: null, error: new Error('Missing quote id') };
  }

  const { data, error } = await supabase
    .from('quotes')
    .select(QUOTE_OWNER_LIST_COLUMNS)
    .eq('id', id)
    .eq('business_id', businessId)
    .maybeSingle();

  if (error) {
    quotesDebugError('fetchQuoteByIdForBusiness:failed', error.message ?? 'unknown', {
      formatted: quotesFormatSupabaseError(error),
      businessId,
      quoteId: id,
    });
  }

  return { data, error };
}

/**
 * Latest active public link expiry for detail (“good until”).
 *
 * @param {string} quoteId
 * @returns {Promise<{ data: { expires_at: string } | null; error: Error | null }>}
 */
export async function fetchActiveQuoteLinkExpiry(quoteId) {
  const { data, error } = await supabase
    .from('quote_public_links')
    .select('expires_at')
    .eq('quote_id', quoteId)
    .eq('is_active', true)
    .order('expires_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    quotesDebugWarn('fetchActiveQuoteLinkExpiry:failed', error.message ?? 'unknown', {
      formatted: quotesFormatSupabaseError(error),
      quoteId,
    });
  }

  return { data, error };
}

/**
 * Owner delete — RLS must allow DELETE where `business_id` matches the signed-in business.
 * `quote_public_links` rows for this quote should CASCADE.
 *
 * @param {string} businessId
 * @param {string} quoteId
 * @returns {Promise<{ deleted: boolean; error: Error | null }>}
 */
export async function deleteQuoteForBusiness(businessId, quoteId) {
  const id = String(quoteId ?? '').trim();

  if (!id) {
    return { deleted: false, error: new Error('Missing quote id') };
  }

  const { data, error } = await supabase
    .from('quotes')
    .delete()
    .eq('id', id)
    .eq('business_id', businessId)
    .select('id');

  if (error) {
    quotesDebugError('deleteQuoteForBusiness:failed', error.message ?? 'unknown', {
      formatted: quotesFormatSupabaseError(error),
      businessId,
      quoteId: id,
    });
    return { deleted: false, error };
  }

  const deleted = Array.isArray(data) && data.length > 0;
  if (!deleted) {
    quotesDebugWarn('deleteQuoteForBusiness:no-rows', 'No quote row deleted', {
      businessId,
      quoteId: id,
    });
  }

  return { deleted, error: deleted ? null : new Error('Quote could not be deleted') };
}
