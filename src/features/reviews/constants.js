/** Gold fill for review stars and rating bars (readable on light and dark shells). */
export const REVIEW_STAR_COLOR = '#EAB308';

export const REVIEWS_FILTER_ALL = 'all';
export const REVIEWS_FILTER_NEEDS_REPLY = 'needs_reply';
export const REVIEWS_FILTER_REPLIED = 'replied';

export const REVIEWS_FILTER_OPTIONS = [
  { key: REVIEWS_FILTER_ALL, label: 'All' },
  { key: REVIEWS_FILTER_NEEDS_REPLY, label: 'Needs reply' },
];

export const REVIEWS_HOW_IT_WORKS_TITLE = 'How reviews work';

export const REVIEWS_HOW_IT_WORKS_DISMISS_LABEL = 'Got it';

export const REVIEWS_HOW_IT_WORKS_INTRO =
  "Mark a visit complete and we'll email your customer a link to leave a review.";

export const REVIEWS_HOW_IT_WORKS_BULLETS = [
  'Customer email required — text message coming soon',
  'One review per customer on your profile',
  'Shows on your public profile',
];

export const REVIEWS_EMPTY_STATE_COPY = {
  title: 'No reviews yet',
  body: "When customers leave a review after a visit, they'll show up here.",
};

export const REVIEWS_EMPTY_SUMMARY = {
  averageRating: 0,
  totalCount: 0,
  breakdown: [
    { stars: 5, percent: 0 },
    { stars: 4, percent: 0 },
    { stars: 3, percent: 0 },
    { stars: 2, percent: 0 },
    { stars: 1, percent: 0 },
  ],
};

/** Collapsed review body length before “Show more”. */
export const REVIEW_BODY_COLLAPSED_MAX_CHARS = 160;

export const REVIEW_SHOW_MORE_LABEL = 'Show more';

export const REVIEW_SHOW_LESS_LABEL = 'Show less';

/** Max characters for a public business reply (matches web dashboard). */
export const REVIEW_REPLY_MAX_LENGTH = 1000;

/** Collapsed reply length before “Show more”. */
export const REVIEW_REPLY_COLLAPSED_MAX_CHARS = 120;

export const REVIEW_REPLY_PLACEHOLDER = 'Write a public reply…';

export const REVIEW_REPLY_BUTTON_LABEL = 'Reply';

export const REVIEW_REPLY_SUBMIT_LABEL = 'Submit';

export const REVIEW_REPLY_CANCEL_LABEL = 'Cancel';

/** @typedef {'needs_reply' | 'replied'} ReviewReplyStatus */
