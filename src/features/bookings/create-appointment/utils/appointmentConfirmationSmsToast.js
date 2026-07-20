import { isValidEmailFormat } from '../../../../utils/email';
import { CUSTOMER_SMS_TOASTS_ENABLED } from '../../../sms/constants/customerSmsHold';
import { bookingCustomerPhoneDigits } from './ownerBookingFieldFormats';

const SMS_SENT_TOAST = 'Confirmation text sent to your customer';
const EMAIL_AND_SMS_SENT_TOAST = 'Customer emailed and texted a confirmation';
const EMAIL_ONLY_SENT_TOAST = 'Confirmation emailed to your customer';

const SMS_SKIP_TOAST = {
  no_phone: 'Couldn’t text a confirmation — no phone on file.',
  invalid_number: 'Couldn’t text a confirmation — invalid phone number.',
  not_configured: 'Appointment saved. Texting isn’t set up yet.',
  error: 'Couldn’t deliver a confirmation text.',
  duplicate: 'A confirmation text was already sent.',
};

const SMS_SKIP_AFTER_EMAIL_TOAST = {
  invalid_number: 'Confirmation emailed. Couldn’t send a text — invalid phone number.',
  not_configured: 'Confirmation emailed. Texting isn’t set up yet.',
  error: 'Confirmation emailed. Couldn’t send a confirmation text.',
  duplicate: 'Confirmation emailed. A confirmation text was already sent.',
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
 * @param {boolean} emailed
 * @returns {string}
 */
function smsSkipToastMessage(reason, emailed) {
  if (emailed) {
    if (reason && SMS_SKIP_AFTER_EMAIL_TOAST[reason]) {
      return SMS_SKIP_AFTER_EMAIL_TOAST[reason];
    }
    return SMS_SKIP_AFTER_EMAIL_TOAST.error;
  }
  if (reason && SMS_SKIP_TOAST[reason]) {
    return SMS_SKIP_TOAST[reason];
  }
  return SMS_SKIP_TOAST.error;
}

/**
 * Non-blocking confirmation feedback after a booking is created (screen stays simple).
 * While {@link CUSTOMER_SMS_TOASTS_ENABLED} is false, only email toasts are shown.
 *
 * @param {{ email: (msg: string) => void; sms: (msg: string, opts?: { type?: string }) => void }} toast
 * @param {string | null | undefined} customerPhone
 * @param {string | null | undefined} customerEmail
 * @param {{ sent?: boolean; reason?: string | null } | null | undefined} serverSms
 */
export function showAppointmentConfirmationSmsToast(
  toast,
  customerPhone,
  customerEmail,
  serverSms,
) {
  const hasEmail = hasCustomerEmail(customerEmail);

  if (!CUSTOMER_SMS_TOASTS_ENABLED) {
    if (hasEmail) {
      toast.email(EMAIL_ONLY_SENT_TOAST);
    }
    return;
  }

  const hasPhone = Boolean(bookingCustomerPhoneDigits(customerPhone));

  if (!hasPhone && !hasEmail) {
    return;
  }

  if (!hasPhone) {
    toast.email(EMAIL_ONLY_SENT_TOAST);
    return;
  }

  if (!serverSms || typeof serverSms !== 'object') {
    if (hasEmail) {
      toast.email(EMAIL_ONLY_SENT_TOAST);
      return;
    }
    // Server may omit `sms` in the body even when a text was sent — still acknowledge for the owner.
    toast.sms(SMS_SENT_TOAST, { type: 'success' });
    return;
  }

  if (serverSms.sent === true) {
    toast.sms(hasEmail ? EMAIL_AND_SMS_SENT_TOAST : SMS_SENT_TOAST, { type: 'success' });
    return;
  }

  toast.sms(smsSkipToastMessage(serverSms.reason, hasEmail), { type: 'info' });
}
