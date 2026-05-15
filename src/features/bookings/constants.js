/** @typedef {'upcoming' | 'past' | 'cancelled'} BookingsListFilter */

/** @type {BookingsListFilter} */
export const BOOKINGS_FILTER_UPCOMING = 'upcoming';

/** @type {BookingsListFilter} */
export const BOOKINGS_FILTER_PAST = 'past';

/** @type {BookingsListFilter} */
export const BOOKINGS_FILTER_CANCELLED = 'cancelled';

export const BOOKINGS_FILTER_OPTIONS = [
  { id: BOOKINGS_FILTER_UPCOMING, label: 'Upcoming' },
  { id: BOOKINGS_FILTER_PAST, label: 'Past' },
  { id: BOOKINGS_FILTER_CANCELLED, label: 'Canceled' },
];

/** Horizontal inset for list mode (tabs + scroll content); cards span this width. */
export const BOOKINGS_LIST_SCREEN_PADDING = 16;

/**
 * Max bookings on **Free** before server blocks new owner bookings — keep aligned with
 * `POST /api/public/bookings` / web cap (mobile has no separate quota API yet).
 */
export const FREE_TIER_BOOKINGS_LIMIT = 5;

/** @typedef {'list' | 'planner'} BookingsViewMode */

/** @type {BookingsViewMode} */
export const BOOKINGS_VIEW_LIST = 'list';

/** @type {BookingsViewMode} */
export const BOOKINGS_VIEW_PLANNER = 'planner';
