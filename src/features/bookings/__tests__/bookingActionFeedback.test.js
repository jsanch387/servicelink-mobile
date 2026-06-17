import { BOOKING_ACTION } from '../constants/jobStatus';
import {
  JOB_COMPLETED_SUCCESS_EMAIL,
  JOB_COMPLETED_SUCCESS_SMS,
  showBookingActionToasts,
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

  it('does not nag when job_completed is idempotent duplicate', () => {
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
