import { BOOKING_ACTION } from '../constants/jobStatus';
import {
  JOB_COMPLETED_SUCCESS_EMAIL,
  JOB_COMPLETED_SUCCESS_SMS,
  JOB_COMPLETED_SUCCESS_SMS_RECEIPT_ONLY,
  WORK_FINISHED_SUCCESS_SMS,
  WORK_FINISHED_SMS_SOFT_NOTE,
  showBookingActionToasts,
  smsSkipMessage,
} from '../utils/bookingActionFeedback';

jest.mock('../../sms/constants/customerSmsHold', () => ({
  CUSTOMER_SMS_TOASTS_ENABLED: true,
}));

describe('showBookingActionToasts (SMS enabled)', () => {
  function createToast() {
    return {
      sms: jest.fn(),
      email: jest.fn(),
      success: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
    };
  }

  it('shows SMS success when sms.sent is true', () => {
    const toast = createToast();
    showBookingActionToasts(toast, BOOKING_ACTION.JOB_COMPLETED, {
      smsSent: true,
      smsReason: null,
      emailSent: false,
      emailReason: null,
    });
    expect(toast.sms).toHaveBeenCalledWith(JOB_COMPLETED_SUCCESS_SMS, { type: 'success' });
    expect(toast.email).not.toHaveBeenCalled();
  });

  it('shows receipt-only SMS success when review invite is skipped', () => {
    const toast = createToast();
    showBookingActionToasts(
      toast,
      BOOKING_ACTION.JOB_COMPLETED,
      {
        smsSent: true,
        smsReason: null,
        emailSent: false,
        emailReason: null,
      },
      { includeReviewLink: false },
    );
    expect(toast.sms).toHaveBeenCalledWith(JOB_COMPLETED_SUCCESS_SMS_RECEIPT_ONLY, {
      type: 'success',
    });
  });

  it('shows email success when sms failed but email sent', () => {
    const toast = createToast();
    showBookingActionToasts(toast, BOOKING_ACTION.JOB_COMPLETED, {
      smsSent: false,
      smsReason: 'no_phone',
      emailSent: true,
      emailReason: null,
    });
    expect(toast.email).toHaveBeenCalledWith(JOB_COMPLETED_SUCCESS_EMAIL, { type: 'success' });
    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.sms).not.toHaveBeenCalledWith(JOB_COMPLETED_SUCCESS_SMS, expect.anything());
  });

  it('shows SMS success for work_finished when sms.sent is true', () => {
    const toast = createToast();
    showBookingActionToasts(toast, BOOKING_ACTION.WORK_FINISHED, {
      smsSent: true,
      smsReason: null,
    });
    expect(toast.sms).toHaveBeenCalledWith(WORK_FINISHED_SUCCESS_SMS, { type: 'success' });
  });

  it('shows info reason when work_finished SMS failed but state advanced', () => {
    const toast = createToast();
    showBookingActionToasts(toast, BOOKING_ACTION.WORK_FINISHED, {
      smsSent: false,
      smsReason: 'error',
    });
    expect(toast.sms).toHaveBeenCalledWith(smsSkipMessage('error'), { type: 'info' });
  });

  it('explains SMS opt-out without treating the action as failed', () => {
    const toast = createToast();
    showBookingActionToasts(toast, BOOKING_ACTION.ON_THE_WAY, {
      smsSent: false,
      smsReason: 'sms_opt_out',
    });
    expect(toast.success).toHaveBeenCalled();
    expect(toast.sms).toHaveBeenCalledWith(smsSkipMessage('sms_opt_out'), { type: 'info' });
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('explains STOP opt-out on job_started and still treats the job as started', () => {
    const toast = createToast();
    showBookingActionToasts(toast, BOOKING_ACTION.JOB_STARTED, {
      smsSent: false,
      smsReason: 'carrier_opt_out',
    });
    expect(toast.sms).toHaveBeenCalledWith(smsSkipMessage('carrier_opt_out'), { type: 'info' });
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('explains SMS opt-out on job_completed when neither channel reached the customer', () => {
    const toast = createToast();
    showBookingActionToasts(toast, BOOKING_ACTION.JOB_COMPLETED, {
      smsSent: false,
      smsReason: 'sms_opt_out',
      emailSent: false,
      emailReason: 'no_email',
    });
    expect(toast.sms).toHaveBeenCalledWith(smsSkipMessage('sms_opt_out'), { type: 'info' });
    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('shows soft note when work_finished SMS failed without a reason', () => {
    const toast = createToast();
    showBookingActionToasts(toast, BOOKING_ACTION.WORK_FINISHED, {
      smsSent: false,
      smsReason: null,
    });
    expect(toast.info).toHaveBeenCalledWith(WORK_FINISHED_SMS_SOFT_NOTE);
  });

  it('stays silent on duplicate skip toasts', () => {
    const toast = createToast();
    showBookingActionToasts(toast, BOOKING_ACTION.ON_THE_WAY, {
      smsSent: false,
      smsReason: 'duplicate',
    });
    expect(toast.success).toHaveBeenCalled();
    expect(toast.sms).not.toHaveBeenCalled();

    const started = createToast();
    showBookingActionToasts(started, BOOKING_ACTION.JOB_STARTED, {
      smsSent: false,
      smsReason: 'duplicate',
    });
    expect(started.sms).not.toHaveBeenCalled();
    expect(started.info).not.toHaveBeenCalled();
  });

  it('maps skip reasons to owner-facing copy', () => {
    expect(smsSkipMessage('no_phone')).toBe('No phone number on file — customer wasn’t texted.');
    expect(smsSkipMessage('sms_opt_out')).toBe(
      'Customer opted out of texts — status still updated.',
    );
    expect(smsSkipMessage('carrier_opt_out')).toBe(
      'Customer opted out of texts (STOP) — status still updated.',
    );
    expect(smsSkipMessage('error')).toBe('Couldn’t send text.');
  });
});
