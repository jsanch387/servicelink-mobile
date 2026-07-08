import { BOOKING_ACTION } from '../constants/jobStatus';
import {
  JOB_COMPLETED_SUCCESS_EMAIL,
  JOB_COMPLETED_SUCCESS_EMAIL_RECEIPT_ONLY,
  JOB_COMPLETED_SUCCESS_SMS,
  JOB_COMPLETED_SUCCESS_SMS_RECEIPT_ONLY,
  WORK_FINISHED_SUCCESS_SMS,
  WORK_FINISHED_SMS_SOFT_NOTE,
  showBookingActionToasts,
  smsSkipMessage,
} from '../utils/bookingActionFeedback';

describe('showBookingActionToasts job_completed', () => {
  function createToast() {
    return {
      sms: jest.fn(),
      email: jest.fn(),
      success: jest.fn(),
      info: jest.fn(),
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

  it('shows receipt-only email success when review invite is skipped', () => {
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

  it('shows state-only success when both channels fail without skip toasts', () => {
    const toast = createToast();
    showBookingActionToasts(toast, BOOKING_ACTION.JOB_COMPLETED, {
      smsSent: false,
      smsReason: 'not_configured',
      emailSent: false,
      emailReason: 'no_email',
    });
    expect(toast.success).toHaveBeenCalledWith('Visit marked complete');
    expect(toast.sms).not.toHaveBeenCalled();
    expect(toast.email).not.toHaveBeenCalled();
    expect(toast.info).not.toHaveBeenCalled();
  });

  it('is silent on duplicate when neither channel sent', () => {
    const toast = createToast();
    showBookingActionToasts(toast, BOOKING_ACTION.JOB_COMPLETED, {
      smsSent: false,
      smsReason: 'duplicate',
      emailSent: false,
      emailReason: null,
    });
    expect(toast.success).toHaveBeenCalledWith('Visit marked complete');
    expect(toast.sms).not.toHaveBeenCalled();
    expect(toast.email).not.toHaveBeenCalled();
    expect(toast.info).not.toHaveBeenCalled();
  });
});

describe('showBookingActionToasts work_finished', () => {
  function createToast() {
    return {
      sms: jest.fn(),
      email: jest.fn(),
      success: jest.fn(),
      info: jest.fn(),
    };
  }

  it('shows SMS success when sms.sent is true', () => {
    const toast = createToast();
    showBookingActionToasts(toast, BOOKING_ACTION.WORK_FINISHED, {
      smsSent: true,
      smsReason: null,
    });
    expect(toast.sms).toHaveBeenCalledWith(WORK_FINISHED_SUCCESS_SMS, { type: 'success' });
  });

  it('shows info reason when SMS failed but state advanced', () => {
    const toast = createToast();
    showBookingActionToasts(toast, BOOKING_ACTION.WORK_FINISHED, {
      smsSent: false,
      smsReason: 'error',
    });
    expect(toast.sms).toHaveBeenCalledWith(smsSkipMessage('error'), { type: 'info' });
  });

  it('shows soft note when SMS failed without a reason', () => {
    const toast = createToast();
    showBookingActionToasts(toast, BOOKING_ACTION.WORK_FINISHED, {
      smsSent: false,
      smsReason: null,
    });
    expect(toast.info).toHaveBeenCalledWith(WORK_FINISHED_SMS_SOFT_NOTE);
  });

  it('is silent on duplicate idempotent response', () => {
    const toast = createToast();
    showBookingActionToasts(toast, BOOKING_ACTION.WORK_FINISHED, {
      smsSent: false,
      smsReason: 'duplicate',
    });
    expect(toast.sms).not.toHaveBeenCalled();
    expect(toast.info).not.toHaveBeenCalled();
  });
});
