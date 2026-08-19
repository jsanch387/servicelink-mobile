import { CUSTOMER_SMS_TOASTS_ENABLED } from '../../sms/constants/customerSmsHold';
import {
  SMS_SKIP_REASON_CARRIER_OPT_OUT,
  SMS_SKIP_REASON_NOT_ELIGIBLE,
  SMS_SKIP_REASON_OPT_OUT,
  isSilentSmsSkipReason,
} from '../../sms/constants/smsMessageTypes';
import { BOOKING_ACTION } from '../constants/jobStatus';

export const ON_THE_WAY_SUCCESS_SMS = 'Customer notified you’re on the way';
export const ON_THE_WAY_SUCCESS_STATE_ONLY = 'Marked on the way';
export const JOB_STARTED_SUCCESS_SMS = 'Customer notified job started';
export const JOB_STARTED_SUCCESS_STATE_ONLY = 'Job started';
export const JOB_STARTED_SMS_SOFT_NOTE = 'Job started — couldn’t text customer';
export const WORK_FINISHED_SUCCESS_SMS = 'Customer notified your service is finished';
export const WORK_FINISHED_SUCCESS_STATE_ONLY = 'Marked done';
export const WORK_FINISHED_SMS_SOFT_NOTE = 'Marked done — couldn’t text customer';
export const JOB_COMPLETED_SUCCESS_SMS = 'Customer notified with invoice and review link';
export const JOB_COMPLETED_SUCCESS_EMAIL = 'Customer notified with invoice and review link';
export const JOB_COMPLETED_SUCCESS_SMS_RECEIPT_ONLY = 'Customer notified with their receipt';
export const JOB_COMPLETED_SUCCESS_EMAIL_RECEIPT_ONLY = 'Customer notified with their receipt';
export const JOB_COMPLETED_SUCCESS_STATE_ONLY = 'Visit complete';
export const JOB_COMPLETED_SMS_SOFT_NOTE = 'Marked complete — couldn’t text customer';

/** Non-blocking copy when state changed but SMS did not send. */
const SMS_SKIP_COULDNT_SEND = 'Couldn’t send text.';

const SMS_SKIP_MESSAGES = {
  no_phone: 'No phone number on file — customer wasn’t texted.',
  invalid_number: 'Phone number looks invalid — customer wasn’t texted.',
  not_configured: SMS_SKIP_COULDNT_SEND,
  [SMS_SKIP_REASON_NOT_ELIGIBLE]: SMS_SKIP_COULDNT_SEND,
  [SMS_SKIP_REASON_OPT_OUT]: 'Customer opted out of texts — status still updated.',
  [SMS_SKIP_REASON_CARRIER_OPT_OUT]: 'Customer opted out of texts (STOP) — status still updated.',
  error: SMS_SKIP_COULDNT_SEND,
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
 * Soft skip toast from `sms.reason`. Duplicate is silent. Missing reason is not toasted here.
 *
 * @param {ReturnType<import('../../../components/ui').useToast>} toast
 * @param {string | null | undefined} reason
 * @returns {boolean} whether a skip toast was shown
 */
function toastSmsSkipIfNeeded(toast, reason) {
  if (!CUSTOMER_SMS_TOASTS_ENABLED) {
    return false;
  }
  if (!reason || isSilentSmsSkipReason(reason)) {
    return false;
  }
  toast.sms(smsSkipMessage(reason), { type: 'info' });
  return true;
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
 * @param {{ includeReviewLink?: boolean }} [options]
 */
export function showBookingActionToasts(toast, action, res, options = {}) {
  if (action === BOOKING_ACTION.ON_THE_WAY) {
    if (CUSTOMER_SMS_TOASTS_ENABLED && res.smsSent) {
      toast.sms(ON_THE_WAY_SUCCESS_SMS, { type: 'success' });
      return;
    }
    toast.success(ON_THE_WAY_SUCCESS_STATE_ONLY);
    toastSmsSkipIfNeeded(toast, res.smsReason);
    return;
  }

  if (action === BOOKING_ACTION.JOB_STARTED) {
    if (CUSTOMER_SMS_TOASTS_ENABLED && res.smsSent) {
      toast.sms(JOB_STARTED_SUCCESS_SMS, { type: 'success' });
      return;
    }
    if (CUSTOMER_SMS_TOASTS_ENABLED) {
      if (toastSmsSkipIfNeeded(toast, res.smsReason)) {
        return;
      }
      if (isSilentSmsSkipReason(res.smsReason)) {
        toast.success(JOB_STARTED_SUCCESS_STATE_ONLY);
        return;
      }
      toast.info(JOB_STARTED_SMS_SOFT_NOTE);
      return;
    }
    toast.success(JOB_STARTED_SUCCESS_STATE_ONLY);
    return;
  }

  if (action === BOOKING_ACTION.WORK_FINISHED) {
    if (isSilentSmsSkipReason(res.smsReason)) {
      return;
    }
    if (CUSTOMER_SMS_TOASTS_ENABLED && res.smsSent) {
      toast.sms(WORK_FINISHED_SUCCESS_SMS, { type: 'success' });
      return;
    }
    if (CUSTOMER_SMS_TOASTS_ENABLED) {
      if (toastSmsSkipIfNeeded(toast, res.smsReason)) {
        return;
      }
      toast.info(WORK_FINISHED_SMS_SOFT_NOTE);
      return;
    }
    toast.success(WORK_FINISHED_SUCCESS_STATE_ONLY);
    return;
  }

  if (action === BOOKING_ACTION.JOB_COMPLETED) {
    const includeReviewLink = options.includeReviewLink !== false;

    if (CUSTOMER_SMS_TOASTS_ENABLED && res.smsSent) {
      toast.sms(
        includeReviewLink ? JOB_COMPLETED_SUCCESS_SMS : JOB_COMPLETED_SUCCESS_SMS_RECEIPT_ONLY,
        { type: 'success' },
      );
      return;
    }
    if (res.emailSent) {
      toast.email(
        includeReviewLink ? JOB_COMPLETED_SUCCESS_EMAIL : JOB_COMPLETED_SUCCESS_EMAIL_RECEIPT_ONLY,
        { type: 'success' },
      );
      return;
    }

    if (toastSmsSkipIfNeeded(toast, res.smsReason)) {
      return;
    }

    toast.success(JOB_COMPLETED_SUCCESS_STATE_ONLY);
  }
}
