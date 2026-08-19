/** Outbound SMS kinds logged in `sms_messages.type`. */
export const SMS_MESSAGE_TYPE_BOOKING_CONFIRMATION = 'booking_confirmation';
export const SMS_MESSAGE_TYPE_ON_THE_WAY = 'on_the_way';
export const SMS_MESSAGE_TYPE_JOB_STARTED = 'job_started';
export const SMS_MESSAGE_TYPE_WORK_FINISHED = 'work_finished';
export const SMS_MESSAGE_TYPE_JOB_COMPLETED = 'job_completed';
export const SMS_MESSAGE_TYPE_REMINDER = 'reminder';
export const SMS_MESSAGE_TYPE_INVOICE = 'invoice';

/** Server skip reason when an owner's plan or allowlist rules out texting entirely. */
export const SMS_SKIP_REASON_NOT_ELIGIBLE = 'not_eligible';

/** `customers.sms_opt_in = false` — owner-side consent off. */
export const SMS_SKIP_REASON_OPT_OUT = 'sms_opt_out';

/** Telnyx 40300 — customer texted STOP. */
export const SMS_SKIP_REASON_CARRIER_OPT_OUT = 'carrier_opt_out';

/** Already sent this action for this booking — no extra toast. */
export const SMS_SKIP_REASON_DUPLICATE = 'duplicate';

/**
 * @param {string | null | undefined} reason
 * @returns {boolean}
 */
export function isSmsOptOutSkipReason(reason) {
  return reason === SMS_SKIP_REASON_OPT_OUT || reason === SMS_SKIP_REASON_CARRIER_OPT_OUT;
}

/**
 * Idempotent skip — apply state, do not add an SMS skip toast.
 * @param {string | null | undefined} reason
 * @returns {boolean}
 */
export function isSilentSmsSkipReason(reason) {
  return reason === SMS_SKIP_REASON_DUPLICATE;
}

/** Statuses that count as a successful on-the-way send for button state. */
export const SMS_ON_THE_WAY_SUCCESS_STATUSES = ['queued', 'sent', 'delivered'];

/** Human labels for timeline rows. Unknown types fall back to a cleaned type string. */
export const SMS_MESSAGE_TYPE_LABELS = {
  [SMS_MESSAGE_TYPE_BOOKING_CONFIRMATION]: 'Booking confirmation',
  [SMS_MESSAGE_TYPE_ON_THE_WAY]: 'On the way',
  [SMS_MESSAGE_TYPE_JOB_STARTED]: 'Job started',
  [SMS_MESSAGE_TYPE_WORK_FINISHED]: 'Work finished',
  [SMS_MESSAGE_TYPE_JOB_COMPLETED]: 'Job completed',
  [SMS_MESSAGE_TYPE_REMINDER]: 'Reminder',
  [SMS_MESSAGE_TYPE_INVOICE]: 'Invoice',
};
