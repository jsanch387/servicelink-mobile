import { showAppointmentConfirmationSmsToast } from '../utils/appointmentConfirmationSmsToast';

describe('showAppointmentConfirmationSmsToast', () => {
  const toast = { email: jest.fn(), sms: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows email toast when customer has a valid email', () => {
    showAppointmentConfirmationSmsToast(toast, '(555) 234-5678', 'jordan@email.com', {
      sent: true,
    });
    expect(toast.email).toHaveBeenCalledWith('Confirmation emailed to your customer');
    expect(toast.sms).not.toHaveBeenCalled();
  });

  it('shows email toast when customer has email but no phone', () => {
    showAppointmentConfirmationSmsToast(toast, '', 'jordan@email.com', null);
    expect(toast.email).toHaveBeenCalledWith('Confirmation emailed to your customer');
    expect(toast.sms).not.toHaveBeenCalled();
  });

  it('does nothing when customer has phone only', () => {
    showAppointmentConfirmationSmsToast(toast, '(555) 234-5678', '', { sent: true });
    expect(toast.email).not.toHaveBeenCalled();
    expect(toast.sms).not.toHaveBeenCalled();
  });

  it('does nothing when customer has no phone or email', () => {
    showAppointmentConfirmationSmsToast(toast, '', '', { sent: true });
    expect(toast.email).not.toHaveBeenCalled();
    expect(toast.sms).not.toHaveBeenCalled();
  });

  it('does not show SMS toasts when server reports SMS failure', () => {
    showAppointmentConfirmationSmsToast(toast, '5552345678', 'jordan@email.com', {
      sent: false,
      reason: 'error',
    });
    expect(toast.email).toHaveBeenCalledWith('Confirmation emailed to your customer');
    expect(toast.sms).not.toHaveBeenCalled();
  });

  it('does not show SMS toasts when server omits sms payload', () => {
    showAppointmentConfirmationSmsToast(toast, '(555) 234-5678', '', null);
    expect(toast.email).not.toHaveBeenCalled();
    expect(toast.sms).not.toHaveBeenCalled();
  });
});
