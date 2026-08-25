/**
 * Canonical customer-update catalog for a booking.
 */

/**
 * @typedef {'text' | 'email'} BookingActivityChannel
 */

/**
 * @typedef {object} BookingActivityEventDef
 * @property {import('@expo/vector-icons').IconProps['name']} icon
 * @property {string} title
 * @property {BookingActivityChannel} channel
 */

/**
 * @typedef {'sent' | 'sending' | 'failed'} BookingActivityOutcome
 */

/**
 * @typedef {object} BookingActivityEvent
 * @property {string} key
 * @property {import('@expo/vector-icons').IconProps['name']} icon
 * @property {string} title
 * @property {BookingActivityOutcome} outcome
 * @property {string} statusLine
 * @property {string} [at]
 * @property {string} [whenLabel]
 * @property {boolean} [optedOut]
 * @property {BookingActivityChannel} channel
 */

/** @type {Record<string, BookingActivityEventDef>} */
export const BOOKING_ACTIVITY_EVENT_DEFS = {
  'confirmation-email': {
    icon: 'checkmark-done',
    title: 'Confirmation',
    channel: 'email',
  },
  'confirmation-sms': {
    icon: 'checkmark-done',
    title: 'Confirmation',
    channel: 'text',
  },
  'reminder-email': {
    icon: 'alarm',
    title: 'Reminder',
    channel: 'email',
  },
  'reminder-sms': {
    icon: 'alarm',
    title: 'Reminder',
    channel: 'text',
  },
  'on-the-way': {
    icon: 'navigate',
    title: 'On the way',
    channel: 'text',
  },
  'job-started': {
    icon: 'play',
    title: 'Job started',
    channel: 'text',
  },
  'work-finished': {
    icon: 'flag',
    title: 'Job done',
    channel: 'text',
  },
  'cancellation-email': {
    icon: 'close-circle',
    title: 'Cancellation',
    channel: 'email',
  },
  'receipt-sms': {
    icon: 'receipt',
    title: 'Receipt',
    channel: 'text',
  },
  'review-email': {
    icon: 'star',
    title: 'Review request',
    channel: 'email',
  },
  'review-sms': {
    icon: 'star',
    title: 'Review request',
    channel: 'text',
  },
};

export const BOOKING_ACTIVITY_SMS_SUCCESS_STATUSES = ['queued', 'sent', 'delivered'];

export const BOOKING_ACTIVITY_SMS_FAILED_STATUSES = ['failed', 'undelivered', 'skipped_opt_out'];

/** Production `sms_messages.type` → catalog key. */
export const BOOKING_ACTIVITY_SMS_TYPE_TO_KEY = {
  booking_confirmation: 'confirmation-sms',
  booking_reminder: 'reminder-sms',
  reminder: 'reminder-sms',
  on_the_way: 'on-the-way',
  job_started: 'job-started',
  work_finished: 'work-finished',
  job_completed: 'receipt-sms',
};
