/** Gold fill for review stars and rating bars (readable on light and dark shells). */
export const REVIEW_STAR_COLOR = '#EAB308';

export const REVIEWS_FILTER_ALL = 'all';
export const REVIEWS_FILTER_NEEDS_REPLY = 'needs_reply';
export const REVIEWS_FILTER_REPLIED = 'replied';

export const REVIEWS_FILTER_OPTIONS = [
  { key: REVIEWS_FILTER_ALL, label: 'All' },
  { key: REVIEWS_FILTER_NEEDS_REPLY, label: 'Needs reply' },
  { key: REVIEWS_FILTER_REPLIED, label: 'Replied' },
];

export const REVIEWS_HOW_IT_WORKS_TITLE = 'How reviews work';

export const REVIEWS_HOW_IT_WORKS_DISMISS_LABEL = 'Got it';

export const REVIEWS_HOW_IT_WORKS_INTRO =
  "Mark a visit complete and we'll email your customer a link to leave a review.";

/** Collapsed review body length before “Show more”. */
export const REVIEW_BODY_COLLAPSED_MAX_CHARS = 160;

export const REVIEW_SHOW_MORE_LABEL = 'Show more';

export const REVIEW_SHOW_LESS_LABEL = 'Show less';

/** Max characters for a public business reply. */
export const REVIEW_REPLY_MAX_LENGTH = 280;

/** Collapsed reply length before “Show more”. */
export const REVIEW_REPLY_COLLAPSED_MAX_CHARS = 120;

export const REVIEW_REPLY_PLACEHOLDER = 'Write a public reply…';

export const REVIEW_REPLY_BUTTON_LABEL = 'Reply';

export const REVIEW_REPLY_SUBMIT_LABEL = 'Submit';

export const REVIEW_REPLY_CANCEL_LABEL = 'Cancel';

export const REVIEWS_HOW_IT_WORKS_BULLETS = [
  'Customer email required — text message coming soon',
  'One review per customer on your profile',
  'Shows on your public profile',
];

/** Static preview — replace with API data later. */
export const REVIEWS_PREVIEW_SUMMARY = {
  averageRating: 4.7,
  totalCount: 3,
  breakdown: [
    { stars: 5, percent: 67 },
    { stars: 4, percent: 33 },
    { stars: 3, percent: 0 },
    { stars: 2, percent: 0 },
    { stars: 1, percent: 0 },
  ],
};

/** @typedef {'needs_reply' | 'replied'} ReviewReplyStatus */

/** Static preview list — replace with API data later. */
export const REVIEWS_PREVIEW_REVIEWS = [
  {
    id: 'preview-1',
    reviewerName: 'Jesus Sanchez',
    dateLabel: 'Jun 1, 2026',
    rating: 5,
    body: 'Really loved the experience. My car looks like new and will be booking in the future. Definitely recommend!',
    reply:
      'Thanks so much for the kind words. We are glad the detail met your expectations and that you noticed the finish on the paint and wheels. We put a lot of care into every visit, so it means a lot when customers plan to come back and recommend us to friends. Hope to see you again soon for your next service.',
    replyStatus: /** @type {ReviewReplyStatus} */ ('replied'),
  },
  {
    id: 'preview-2',
    reviewerName: 'Alex Rivera',
    dateLabel: 'May 18, 2026',
    rating: 4,
    body: 'Great communication and showed up on time. Would book again.',
    reply: null,
    replyStatus: /** @type {ReviewReplyStatus} */ ('needs_reply'),
  },
  {
    id: 'preview-3',
    reviewerName: 'Maria Chen',
    dateLabel: 'Apr 30, 2026',
    rating: 5,
    body: 'I booked a full detail before a road trip and could not be happier with how the car turned out. The team was on time, walked me through what they were doing, and the interior smells fresh without that overpowering chemical smell. Paint looks deep again, wheels are spotless, and they even caught a few spots I would have missed. Pricing felt fair for the level of work, communication was clear over text, and I appreciated the follow-up photo when they were done. Already told two coworkers about this shop and plan to set up recurring maintenance details through ServiceLink.',
    reply: null,
    replyStatus: /** @type {ReviewReplyStatus} */ ('needs_reply'),
  },
];
