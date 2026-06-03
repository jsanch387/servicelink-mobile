import { supabase } from '../../../lib/supabase';

export const REVIEW_OWNER_LIST_COLUMNS =
  'id, author_display_name, rating, body, created_at, owner_reply_body, owner_replied_at, is_hidden';

const REVIEWS_LIST_LIMIT = 100;

/**
 * Owner inbox — newest reviews first. Scoped to `business_profiles.id`.
 *
 * @param {string} businessId
 */
export async function fetchReviewsForBusiness(businessId) {
  const { data, error } = await supabase
    .from('reviews')
    .select(REVIEW_OWNER_LIST_COLUMNS)
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
    .limit(REVIEWS_LIST_LIMIT);

  return { data, error };
}

/**
 * Public booking-link profile — visible reviews only (`is_hidden = false`).
 *
 * @param {string} businessId
 */
export async function fetchPublicReviewsForBusiness(businessId) {
  const { data, error } = await supabase
    .from('reviews')
    .select(REVIEW_OWNER_LIST_COLUMNS)
    .eq('business_id', businessId)
    .eq('is_hidden', false)
    .order('created_at', { ascending: false })
    .limit(REVIEWS_LIST_LIMIT);

  return { data, error };
}

/**
 * Post or update the owner's public reply on a review row.
 *
 * @param {string} businessId
 * @param {string} reviewId
 * @param {string} replyText trimmed, 1–1000 chars
 */
export async function updateReviewReply(businessId, reviewId, replyText) {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('reviews')
    .update({
      owner_reply_body: replyText,
      owner_replied_at: now,
    })
    .eq('id', reviewId)
    .eq('business_id', businessId)
    .select(REVIEW_OWNER_LIST_COLUMNS)
    .single();

  return { data, error };
}
