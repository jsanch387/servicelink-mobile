import {
  SMS_MESSAGE_TYPE_BOOKING_CONFIRMATION,
  SMS_MESSAGE_TYPE_JOB_COMPLETED,
  SMS_MESSAGE_TYPE_JOB_STARTED,
  SMS_MESSAGE_TYPE_ON_THE_WAY,
  SMS_MESSAGE_TYPE_WORK_FINISHED,
} from '../constants/smsMessageTypes';

/**
 * Sample outbound texts for the rotating bubble presentation
 * (upsell + What’s new). Matches real job-lifecycle SMS kinds.
 *
 * @param {string | null | undefined} businessName
 * @returns {Array<{ type: string; body: string }>}
 */
export function buildCustomerSmsPreviewMessages(businessName) {
  const name = String(businessName ?? '').trim() || 'Your business';
  return [
    {
      type: SMS_MESSAGE_TYPE_BOOKING_CONFIRMATION,
      body: 'Your appointment is confirmed for Mon, Jun 15 at 2:00 PM. Questions? Contact your service provider.',
    },
    {
      type: SMS_MESSAGE_TYPE_ON_THE_WAY,
      body: `${name} is on the way for your appointment.`,
    },
    {
      type: SMS_MESSAGE_TYPE_JOB_STARTED,
      body: 'Your service has started.',
    },
    {
      type: SMS_MESSAGE_TYPE_WORK_FINISHED,
      body: 'Your service is finished and ready for you.',
    },
    {
      type: SMS_MESSAGE_TYPE_JOB_COMPLETED,
      body: 'Your receipt is ready.\nIf you can please leave us a review, we would appreciate that.',
    },
  ];
}
