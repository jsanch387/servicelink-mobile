/**
 * Canonical customer-update catalog for a booking.
 */

/** @typedef {'booked' | 'upcoming' | 'during' | 'canceled' | 'after'} BookingActivityGroupId */

/**
 * @typedef {object} BookingActivityEventDef
 * @property {BookingActivityGroupId} group
 * @property {import('@expo/vector-icons').IconProps['name']} icon
 * @property {string} iconColor
 * @property {string} iconBg
 * @property {string} title
 */

/**
 * @typedef {object} BookingActivityEvent
 * @property {string} key
 * @property {import('@expo/vector-icons').IconProps['name']} icon
 * @property {string} iconColor
 * @property {string} iconBg
 * @property {string} title
 * @property {string} status
 * @property {boolean} [comingSoon]
 */

/**
 * @typedef {object} BookingActivityGroup
 * @property {BookingActivityGroupId} id
 * @property {string} title
 * @property {BookingActivityEvent[]} events
 */

/** @type {Record<string, BookingActivityEventDef>} */
export const BOOKING_ACTIVITY_EVENT_DEFS = {
  'confirmation-email': {
    group: 'booked',
    icon: 'mail-outline',
    iconColor: '#0a84ff',
    iconBg: 'rgba(10, 132, 255, 0.14)',
    title: 'Confirmation email',
  },
  'confirmation-sms': {
    group: 'booked',
    icon: 'chatbubble-ellipses-outline',
    iconColor: '#34c759',
    iconBg: 'rgba(52, 199, 89, 0.16)',
    title: 'Confirmation text',
  },
  'reminder-email': {
    group: 'upcoming',
    icon: 'alarm-outline',
    iconColor: '#fb923c',
    iconBg: 'rgba(251, 146, 60, 0.16)',
    title: 'Reminder email',
  },
  'reminder-sms': {
    group: 'upcoming',
    icon: 'alarm-outline',
    iconColor: '#fb923c',
    iconBg: 'rgba(251, 146, 60, 0.16)',
    title: 'Reminder text',
  },
  'on-the-way': {
    group: 'during',
    icon: 'navigate-outline',
    iconColor: '#0a84ff',
    iconBg: 'rgba(10, 132, 255, 0.14)',
    title: 'On the way',
  },
  'job-started': {
    group: 'during',
    icon: 'play-outline',
    iconColor: '#10b981',
    iconBg: 'rgba(16, 185, 129, 0.16)',
    title: 'Job started',
  },
  'work-finished': {
    group: 'during',
    icon: 'flag-outline',
    iconColor: '#f59e0b',
    iconBg: 'rgba(245, 158, 11, 0.16)',
    title: 'Job done',
  },
  'cancellation-email': {
    group: 'canceled',
    icon: 'close-circle-outline',
    iconColor: '#f87171',
    iconBg: 'rgba(248, 113, 113, 0.14)',
    title: 'Cancellation email',
  },
  'receipt-sms': {
    group: 'after',
    icon: 'receipt-outline',
    iconColor: '#38bdf8',
    iconBg: 'rgba(56, 189, 248, 0.16)',
    title: 'Receipt text',
  },
  'review-link': {
    group: 'after',
    icon: 'star-outline',
    iconColor: '#f59e0b',
    iconBg: 'rgba(245, 158, 11, 0.16)',
    title: 'Review link',
  },
};

/** @type {{ id: BookingActivityGroupId; title: string }[]} */
export const BOOKING_ACTIVITY_GROUP_ORDER = [
  { id: 'booked', title: 'Booked' },
  { id: 'upcoming', title: 'Before the visit' },
  { id: 'during', title: 'During the visit' },
  { id: 'canceled', title: 'Canceled' },
  { id: 'after', title: 'After the visit' },
];

export const BOOKING_ACTIVITY_SMS_SUCCESS_STATUSES = ['queued', 'sent', 'delivered'];

/** Production `sms_messages.type` → catalog key. Failed rows are ignored. */
export const BOOKING_ACTIVITY_SMS_TYPE_TO_KEY = {
  booking_confirmation: 'confirmation-sms',
  booking_reminder: 'reminder-sms',
  reminder: 'reminder-sms',
  on_the_way: 'on-the-way',
  job_started: 'job-started',
  work_finished: 'work-finished',
  job_completed: 'receipt-sms',
};
