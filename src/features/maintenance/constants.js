/** @type {const} */
export const MAINTENANCE_TAB_PENDING = 'pending';

/** Accepted maintenance enrollments (visit not done yet). */
export const MAINTENANCE_TAB_CONFIRMED = 'confirmed';

/** Maintenance whose linked booking is marked complete. */
export const MAINTENANCE_TAB_COMPLETED = 'completed';

export const MAINTENANCE_TAB_OPTIONS = [
  { key: MAINTENANCE_TAB_PENDING, label: 'Pending' },
  { key: MAINTENANCE_TAB_CONFIRMED, label: 'Confirmed' },
  { key: MAINTENANCE_TAB_COMPLETED, label: 'Completed' },
];

export const MAINTENANCE_DETAIL_NOT_FOUND_USER_MESSAGE =
  'This maintenance offer is not in your list anymore. Go back and pull down to refresh.';

export const MAINTENANCE_LIST_EMPTY_PENDING = {
  title: 'No pending links',
  body: 'When you send a maintenance service link, it shows here while the customer pays and confirms.',
};

export const MAINTENANCE_LIST_EMPTY_CONFIRMED = {
  title: 'No confirmed maintenance yet',
  body: 'After a customer pays and confirms from their link, active visits show here.',
};

export const MAINTENANCE_LIST_EMPTY_COMPLETED = {
  title: 'No completed maintenance yet',
  body: 'When you mark the linked booking complete, it moves here.',
};

export const MAINTENANCE_DETAIL_LINK_READY_COPY =
  'Copy this link and send it to your customer. They use it to review, pay, and confirm.';

export const MAINTENANCE_DETAIL_LINK_UNAVAILABLE_COPY = 'Link not ready. Pull down to refresh.';

export const MAINTENANCE_DETAIL_COPY_LINK_BUTTON = 'Copy link';

export const MAINTENANCE_DETAIL_CUSTOMER_CHOOSES_SCHEDULE_COPY =
  'Your customer will choose a date and time.';

export const MAINTENANCE_DETAIL_DELETE_BUTTON = 'Remove maintenance detail';

export const MAINTENANCE_DETAIL_DELETE_ALERT_TITLE = 'Remove this maintenance detail?';

export const MAINTENANCE_DETAIL_DELETE_ALERT_MESSAGE =
  'Their link will stop working. This only removes details that are still waiting for the customer to pay and confirm.';
