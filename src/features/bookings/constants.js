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

/** @typedef {'list' | 'planner'} BookingsViewMode */

/** @type {BookingsViewMode} */
export const BOOKINGS_VIEW_LIST = 'list';

/** @type {BookingsViewMode} */
export const BOOKINGS_VIEW_PLANNER = 'planner';
