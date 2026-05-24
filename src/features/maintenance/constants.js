/** @type {const} */
export const MAINTENANCE_TAB_PENDING = 'pending';

/** Accepted or completed maintenance enrollments. */
export const MAINTENANCE_TAB_CONFIRMED = 'confirmed';

export const MAINTENANCE_TAB_OPTIONS = [
  { key: MAINTENANCE_TAB_PENDING, label: 'Pending' },
  { key: MAINTENANCE_TAB_CONFIRMED, label: 'Confirmed' },
];

export const MAINTENANCE_DETAIL_NOT_FOUND_USER_MESSAGE =
  'This maintenance offer is not in your list anymore. Go back and pull down to refresh.';

export const MAINTENANCE_LIST_EMPTY_PENDING = {
  title: 'No pending links',
  body: 'When you send a maintenance service link, it shows here while the customer pays and confirms.',
};

export const MAINTENANCE_LIST_EMPTY_CONFIRMED = {
  title: 'No confirmed maintenance yet',
  body: 'After a customer pays and confirms from their link, it shows here.',
};
