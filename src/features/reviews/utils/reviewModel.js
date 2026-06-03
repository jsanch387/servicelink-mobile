import {
  REVIEW_REPLY_MAX_LENGTH,
  REVIEWS_FILTER_NEEDS_REPLY,
  REVIEWS_FILTER_REPLIED,
} from '../constants';
import { formatReviewDateLabel } from './formatReviewDateLabel';

/**
 * @typedef {object} ReviewOwnerReply
 * @property {string} body
 * @property {string} repliedAt
 */

/**
 * @typedef {object} ReviewListItem
 * @property {string} id
 * @property {string} authorDisplayName
 * @property {number} rating
 * @property {string} body
 * @property {string} createdAt
 * @property {string} dateLabel
 * @property {ReviewOwnerReply | null} ownerReply
 * @property {boolean} isHidden
 * @property {'needs_reply' | 'replied'} replyStatus
 */

/**
 * @param {string | null | undefined} replyBody
 * @param {string | null | undefined} repliedAt
 */
export function hasOwnerReply(replyBody, repliedAt) {
  const trimmed = typeof replyBody === 'string' ? replyBody.trim() : '';
  return trimmed.length > 0 && Boolean(repliedAt);
}

/**
 * @param {Record<string, unknown>} row
 * @returns {ReviewListItem}
 */
export function mapReviewRowToModel(row) {
  const replyBody = typeof row.owner_reply_body === 'string' ? row.owner_reply_body.trim() : '';
  const repliedAt =
    typeof row.owner_replied_at === 'string' && row.owner_replied_at.trim()
      ? row.owner_replied_at
      : null;
  const hasReply = hasOwnerReply(replyBody, repliedAt);

  return {
    id: String(row.id),
    authorDisplayName:
      typeof row.author_display_name === 'string' && row.author_display_name.trim()
        ? row.author_display_name.trim()
        : 'Customer',
    rating: typeof row.rating === 'number' ? row.rating : Number(row.rating) || 0,
    body: typeof row.body === 'string' ? row.body : '',
    createdAt: typeof row.created_at === 'string' ? row.created_at : '',
    dateLabel: formatReviewDateLabel(typeof row.created_at === 'string' ? row.created_at : null),
    ownerReply: hasReply ? { body: replyBody, repliedAt } : null,
    isHidden: row.is_hidden === true,
    replyStatus: hasReply ? REVIEWS_FILTER_REPLIED : REVIEWS_FILTER_NEEDS_REPLY,
  };
}

/**
 * @param {string} text
 */
export function validateReviewReply(text) {
  const trimmed = typeof text === 'string' ? text.trim() : '';

  if (!trimmed) {
    return { ok: false, message: 'Enter a reply before posting.' };
  }

  if (trimmed.length > REVIEW_REPLY_MAX_LENGTH) {
    return {
      ok: false,
      message: `Reply must be ${REVIEW_REPLY_MAX_LENGTH} characters or less.`,
    };
  }

  return { ok: true, value: trimmed };
}
