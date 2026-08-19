import { isValidEmailFormat } from '../../../../utils/email';
import { CUSTOMER_SMS_TOASTS_ENABLED } from '../../../sms/constants/customerSmsHold';
import { SMS_SKIP_REASON_NOT_ELIGIBLE } from '../../../sms/constants/smsMessageTypes';
import { bookingCustomerPhoneDigits } from './ownerBookingFieldFormats';

const CUSTOMER_NOTIFIED_TOAST = 'Your customer was notified';

/** Only reachable when SMS was the customer's one channel — no email to fall back on. */
const SMS_SKIP_TOAST = {
  no_phone: 'Couldn’t notify your customer — no phone on file.',
  invalid_number: 'Couldn’t notify your customer — invalid phone number.',
  not_configured: 'Appointment saved. Texting isn’t set up yet.',
  sms_opt_out: 'Couldn’t notify your customer — they opted out of texts.',
  carrier_opt_out: 'Couldn’t notify your customer — they opted out of texts (STOP).',
  error: 'Couldn’t notify your customer.',
  duplicate: 'Your customer was already notified.',
};

/**
 * @param {string | null | undefined} email
 * @returns {boolean}
 */
function hasCustomerEmail(email) {
  return isValidEmailFormat(email);
}

/**
 * @param {string | null | undefined} reason
 * @returns {string}
 */
function smsSkipToastMessage(reason) {
  if (reason && SMS_SKIP_TOAST[reason]) {
    return SMS_SKIP_TOAST[reason];
  }
  return SMS_SKIP_TOAST.error;
}

/**
 * Non-blocking confirmation feedback after a booking is created (screen stays simple).
 *
 * Deliberately channel-agnostic on success: the server picks email, SMS, or both,
 * so naming a channel here can contradict what actually went out.
 *
 * `smsEnabled` should be this owner's runtime SMS access
 * (`useCustomerSmsAccess().canUseSms`); when false the owner never sees texting copy.
 *
 * @param {{
 *   success: (msg: string) => void;
 *   sms: (msg: string, opts?: { type?: string }) => void;
 * }} toast
 * @param {string | null | undefined} customerPhone
 * @param {string | null | undefined} customerEmail
 * @param {{ sent?: boolean; reason?: string | null } | null | undefined} serverSms
 * @param {{ smsEnabled?: boolean }} [options]
 */
export function showAppointmentConfirmationSmsToast(
  toast,
  customerPhone,
  customerEmail,
  serverSms,
  { smsEnabled = CUSTOMER_SMS_TOASTS_ENABLED } = {},
) {
  const hasEmail = hasCustomerEmail(customerEmail);
  const hasPhone = Boolean(bookingCustomerPhoneDigits(customerPhone));

  if (!hasPhone && !hasEmail) {
    return;
  }

  // An email on file is the server's baseline confirmation, so the customer hears
  // from us whatever happens with SMS.
  if (hasEmail) {
    toast.success(CUSTOMER_NOTIFIED_TOAST);
    return;
  }

  // Phone only — SMS is the sole channel, so its outcome decides what we can claim.
  if (!smsEnabled) {
    return;
  }

  if (!serverSms || typeof serverSms !== 'object') {
    return;
  }

  if (serverSms.sent === true) {
    toast.success(CUSTOMER_NOTIFIED_TOAST);
    return;
  }

  if (serverSms.reason === SMS_SKIP_REASON_NOT_ELIGIBLE) {
    return;
  }

  toast.sms(smsSkipToastMessage(serverSms.reason), { type: 'info' });
}
