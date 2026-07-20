import { BOOKING_ACTION } from '../constants/jobStatus';
import {
  JOB_COMPLETED_SUCCESS_EMAIL,
  JOB_COMPLETED_SUCCESS_EMAIL_RECEIPT_ONLY,
  JOB_COMPLETED_SUCCESS_STATE_ONLY,
  JOB_STARTED_SUCCESS_STATE_ONLY,
  ON_THE_WAY_SUCCESS_STATE_ONLY,
  WORK_FINISHED_SUCCESS_STATE_ONLY,
  showBookingActionToasts,
} from '../utils/bookingActionFeedback';

jest.mock('../../sms/constants/customerSmsHold', () => ({
  CUSTOMER_SMS_TOASTS_ENABLED: false,
}));

describe('showBookingActionToasts (SMS hold)', () => {
  function createToast() {
    return {
      sms: jest.fn(),
      email: jest.fn(),
      success: jest.fn(),
      info: jest.fn(),
    };
  }

  it('job_completed prefers email toast and never shows SMS', () => {
    const toast = createToast();
    showBookingActionToasts(toast, BOOKING_ACTION.JOB_COMPLETED, {
      smsSent: true,
      smsReason: null,
      emailSent: true,
      emailReason: null,
    });
    expect(toast.email).toHaveBeenCalledWith(JOB_COMPLETED_SUCCESS_EMAIL, { type: 'success' });
    expect(toast.sms).not.toHaveBeenCalled();
  });

  it('job_completed shows receipt-only email when review invite is skipped', () => {
    const toast = createToast();
    showBookingActionToasts(
      toast,
      BOOKING_ACTION.JOB_COMPLETED,
      {
        smsSent: false,
        smsReason: 'no_phone',
        emailSent: true,
        emailReason: null,
      },
      { includeReviewLink: false },
    );
    expect(toast.email).toHaveBeenCalledWith(JOB_COMPLETED_SUCCESS_EMAIL_RECEIPT_ONLY, {
      type: 'success',
    });
    expect(toast.sms).not.toHaveBeenCalled();
  });

  it('job_completed ignores sms.sent and uses state-only when no email', () => {
    const toast = createToast();
    showBookingActionToasts(toast, BOOKING_ACTION.JOB_COMPLETED, {
      smsSent: true,
      smsReason: null,
      emailSent: false,
      emailReason: null,
    });
    expect(toast.success).toHaveBeenCalledWith(JOB_COMPLETED_SUCCESS_STATE_ONLY);
    expect(toast.sms).not.toHaveBeenCalled();
    expect(toast.email).not.toHaveBeenCalled();
  });

  it('job_completed shows state-only when both channels fail without skip toasts', () => {
    const toast = createToast();
    showBookingActionToasts(toast, BOOKING_ACTION.JOB_COMPLETED, {
      smsSent: false,
      smsReason: 'not_configured',
      emailSent: false,
      emailReason: 'no_email',
    });
    expect(toast.success).toHaveBeenCalledWith(JOB_COMPLETED_SUCCESS_STATE_ONLY);
    expect(toast.sms).not.toHaveBeenCalled();
    expect(toast.email).not.toHaveBeenCalled();
    expect(toast.info).not.toHaveBeenCalled();
  });

  it('work_finished shows state-only without SMS toasts', () => {
    const toast = createToast();
    showBookingActionToasts(toast, BOOKING_ACTION.WORK_FINISHED, {
      smsSent: true,
      smsReason: null,
    });
    expect(toast.success).toHaveBeenCalledWith(WORK_FINISHED_SUCCESS_STATE_ONLY);
    expect(toast.sms).not.toHaveBeenCalled();
    expect(toast.info).not.toHaveBeenCalled();
  });

  it('work_finished is silent on duplicate', () => {
    const toast = createToast();
    showBookingActionToasts(toast, BOOKING_ACTION.WORK_FINISHED, {
      smsSent: false,
      smsReason: 'duplicate',
    });
    expect(toast.sms).not.toHaveBeenCalled();
    expect(toast.info).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('on_the_way shows state-only without SMS skip toasts', () => {
    const toast = createToast();
    showBookingActionToasts(toast, BOOKING_ACTION.ON_THE_WAY, {
      smsSent: false,
      smsReason: 'not_configured',
    });
    expect(toast.success).toHaveBeenCalledWith(ON_THE_WAY_SUCCESS_STATE_ONLY);
    expect(toast.sms).not.toHaveBeenCalled();
  });

  it('job_started shows state-only without SMS soft notes', () => {
    const toast = createToast();
    showBookingActionToasts(toast, BOOKING_ACTION.JOB_STARTED, {
      smsSent: false,
      smsReason: 'error',
    });
    expect(toast.success).toHaveBeenCalledWith(JOB_STARTED_SUCCESS_STATE_ONLY);
    expect(toast.sms).not.toHaveBeenCalled();
    expect(toast.info).not.toHaveBeenCalled();
  });
});
