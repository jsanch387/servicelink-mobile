import { BOOKING_ACTION } from '../constants/jobStatus';

export const ON_THE_WAY_SUCCESS_SMS = 'Customer notified you’re on the way';
export const ON_THE_WAY_SUCCESS_STATE_ONLY = 'Marked on the way';
export const JOB_STARTED_SUCCESS_SMS = 'Customer notified the service is starting';
export const JOB_STARTED_SMS_SOFT_NOTE = 'Marked started — couldn’t text customer';
export const JOB_COMPLETED_SUCCESS_SMS = 'Customer notified the service is done';
export const JOB_COMPLETED_SUCCESS_EMAIL = 'Customer notified the service is done';
export const JOB_COMPLETED_SUCCESS_STATE_ONLY = 'Visit marked complete';
export const JOB_COMPLETED_SMS_SOFT_NOTE = 'Marked complete — couldn’t text customer';

/** Non-blocking copy when state changed but SMS did not send. */
const SMS_SKIP_MESSAGES = {
  no_phone: 'Couldn’t text the customer — no phone on file.',
  invalid_number: 'Couldn’t text the customer — invalid phone number.',
  duplicate: 'Couldn’t text the customer — already notified.',
  not_configured: 'Couldn’t text the customer — texting isn’t set up yet.',
  error: 'Couldn’t text the customer.',
};

/** Non-blocking copy when visit completed but review email did not send. */
const EMAIL_SKIP_MESSAGES = {
  no_email: 'Couldn’t email the customer — no email on file.',
  duplicate: 'Couldn’t email the customer — already notified.',
  not_configured: 'Couldn’t email the customer — email isn’t set up yet.',
  error: 'Couldn’t email the customer.',
};

/**
 * @param {string | null | undefined} reason
 * @returns {string}
 */
export function smsSkipMessage(reason) {
  if (reason && SMS_SKIP_MESSAGES[reason]) {
    return SMS_SKIP_MESSAGES[reason];
  }
  return SMS_SKIP_MESSAGES.error;
}

/**
 * @param {string | null | undefined} reason
 * @returns {string}
 */
export function emailSkipMessage(reason) {
  if (reason && EMAIL_SKIP_MESSAGES[reason]) {
    return EMAIL_SKIP_MESSAGES[reason];
  }
  return EMAIL_SKIP_MESSAGES.error;
}

/**
 * @param {ReturnType<import('../../../components/ui').useToast>} toast
 * @param {string} action
 * @param {{
 *   smsSent: boolean;
 *   smsReason: string | null;
 *   emailSent?: boolean;
 *   emailReason?: string | null;
 * }} res
 */
export function showBookingActionToasts(toast, action, res) {
  if (action === BOOKING_ACTION.ON_THE_WAY) {
    if (res.smsSent) {
      toast.sms(ON_THE_WAY_SUCCESS_SMS, { type: 'success' });
      return;
    }
    toast.success(ON_THE_WAY_SUCCESS_STATE_ONLY);
    toast.sms(smsSkipMessage(res.smsReason), { type: 'info' });
    return;
  }

  if (action === BOOKING_ACTION.JOB_STARTED) {
    if (res.smsSent) {
      toast.sms(JOB_STARTED_SUCCESS_SMS, { type: 'success' });
      return;
    }
    toast.info(JOB_STARTED_SMS_SOFT_NOTE);
    return;
  }

  if (action === BOOKING_ACTION.JOB_COMPLETED) {
    const isIdempotentDuplicate =
      !res.smsSent &&
      !res.emailSent &&
      (res.smsReason === 'duplicate' || res.emailReason === 'duplicate');

    if (res.smsSent) {
      toast.sms(JOB_COMPLETED_SUCCESS_SMS, { type: 'success' });
      return;
    }
    if (res.emailSent) {
      toast.email(JOB_COMPLETED_SUCCESS_EMAIL, { type: 'success' });
      return;
    }
    toast.success(JOB_COMPLETED_SUCCESS_STATE_ONLY);
    if (isIdempotentDuplicate) {
      return;
    }
    if (res.smsReason && res.smsReason !== 'duplicate') {
      toast.sms(smsSkipMessage(res.smsReason), { type: 'info' });
    } else if (res.emailReason && res.emailReason !== 'duplicate') {
      toast.email(emailSkipMessage(res.emailReason), { type: 'info' });
    } else if (!res.smsReason && !res.emailReason) {
      toast.info(JOB_COMPLETED_SMS_SOFT_NOTE);
    }
  }
}
