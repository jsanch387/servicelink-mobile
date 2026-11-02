import { supabase } from '../../../lib/supabase';
import { REVIEWS_INBOX_PAGE_SIZE } from '../constants/reviewsApiRoutes';

export const REVIEW_OWNER_LIST_COLUMNS =
  'id, author_display_name, rating, body, created_at, owner_reply_body, owner_replied_at, is_hidden';

const REVIEWS_LIST_LIMIT = 100;

/**
 * One page of ServiceLink reviews. Used only when the merged inbox route rejects the phone token.
 *
 * @param {string} businessId
 * @param {number} [offset]
 */
export async function fetchReviewsForBusiness(businessId, offset = 0) {
  const from = Math.max(0, offset);
  const to = from + REVIEWS_INBOX_PAGE_SIZE - 1;
  const { data, error, count } = await supabase
    .from('reviews')
    .select(REVIEW_OWNER_LIST_COLUMNS, { count: 'exact' })
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
    .range(from, to);

  const rows = data ?? [];
  const total = typeof count === 'number' ? count : from + rows.length;
  return { data: rows, error, hasMore: !error && from + rows.length < total };
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
