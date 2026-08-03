import { showAppointmentConfirmationSmsToast } from '../utils/appointmentConfirmationSmsToast';

describe('showAppointmentConfirmationSmsToast', () => {
  const toast = { success: jest.fn(), sms: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses one channel-agnostic toast when the customer has both email and phone', () => {
    showAppointmentConfirmationSmsToast(toast, '(555) 234-5678', 'jordan@email.com', {
      sent: true,
    });
    expect(toast.success).toHaveBeenCalledWith('Your customer was notified');
    expect(toast.sms).not.toHaveBeenCalled();
  });

  it('uses the same toast when the customer has email but no phone', () => {
    showAppointmentConfirmationSmsToast(toast, '', 'jordan@email.com', null);
    expect(toast.success).toHaveBeenCalledWith('Your customer was notified');
    expect(toast.sms).not.toHaveBeenCalled();
  });

  it('uses the same toast when the customer has phone only and the text sent', () => {
    showAppointmentConfirmationSmsToast(toast, '(555) 234-5678', '', { sent: true });
    expect(toast.success).toHaveBeenCalledWith('Your customer was notified');
    expect(toast.sms).not.toHaveBeenCalled();
  });

  it('still reports success when email is on file and the text failed', () => {
    showAppointmentConfirmationSmsToast(toast, '5552345678', 'jordan@email.com', {
      sent: false,
      reason: 'error',
    });
    expect(toast.success).toHaveBeenCalledWith('Your customer was notified');
    expect(toast.sms).not.toHaveBeenCalled();
  });

  it('does nothing when customer has no phone or email', () => {
    showAppointmentConfirmationSmsToast(toast, '', '', { sent: true });
    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.sms).not.toHaveBeenCalled();
  });

  it('flags an actionable failure when SMS was the only channel', () => {
    showAppointmentConfirmationSmsToast(toast, '5552345678', '', {
      sent: false,
      reason: 'invalid_number',
    });
    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.sms).toHaveBeenCalledWith(
      'Couldn’t notify your customer — invalid phone number.',
      { type: 'info' },
    );
  });

  it('stays silent when the server rules the owner out of texting', () => {
    showAppointmentConfirmationSmsToast(toast, '5552345678', '', {
      sent: false,
      reason: 'not_eligible',
    });
    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.sms).not.toHaveBeenCalled();
  });

  it('never mentions texting for an owner without SMS access', () => {
    showAppointmentConfirmationSmsToast(
      toast,
      '5552345678',
      '',
      { sent: false, reason: 'error' },
      { smsEnabled: false },
    );
    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.sms).not.toHaveBeenCalled();
  });

  it('claims nothing when the server reports no SMS outcome and there is no email', () => {
    showAppointmentConfirmationSmsToast(toast, '(555) 234-5678', '', null);
    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.sms).not.toHaveBeenCalled();
  });
});
