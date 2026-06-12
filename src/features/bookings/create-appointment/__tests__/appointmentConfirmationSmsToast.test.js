import { showAppointmentConfirmationSmsToast } from '../utils/appointmentConfirmationSmsToast';

describe('showAppointmentConfirmationSmsToast', () => {
  const toast = { email: jest.fn(), sms: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows sms bubble when email and SMS were sent', () => {
    showAppointmentConfirmationSmsToast(toast, '(555) 234-5678', 'jordan@email.com', {
      sent: true,
    });
    expect(toast.sms).toHaveBeenCalledWith('Customer emailed and texted a confirmation', {
      type: 'success',
    });
    expect(toast.email).not.toHaveBeenCalled();
  });

  it('shows sms bubble when SMS was sent without email', () => {
    showAppointmentConfirmationSmsToast(toast, '(555) 234-5678', '', { sent: true });
    expect(toast.sms).toHaveBeenCalledWith('Confirmation text sent to your customer', {
      type: 'success',
    });
  });

  it('shows sms info bubble when SMS failed and customer had email', () => {
    showAppointmentConfirmationSmsToast(toast, '5552345678', 'jordan@email.com', {
      sent: false,
      reason: 'error',
    });
    expect(toast.sms).toHaveBeenCalledWith(
      'Confirmation emailed. Couldn’t send a confirmation text.',
      { type: 'info' },
    );
    expect(toast.email).not.toHaveBeenCalled();
  });

  it('shows sms info bubble when SMS failed and customer had phone only', () => {
    showAppointmentConfirmationSmsToast(toast, '5552345678', '', { sent: false, reason: 'error' });
    expect(toast.sms).toHaveBeenCalledWith('Couldn’t deliver a confirmation text.', {
      type: 'info',
    });
  });

  it('shows email-only toast when customer has email but no phone', () => {
    showAppointmentConfirmationSmsToast(toast, '', 'jordan@email.com', null);
    expect(toast.email).toHaveBeenCalledWith('Confirmation emailed to your customer');
  });

  it('does nothing when customer has no phone or email', () => {
    showAppointmentConfirmationSmsToast(toast, '', '', { sent: true });
    expect(toast.email).not.toHaveBeenCalled();
    expect(toast.sms).not.toHaveBeenCalled();
  });

  it('shows email-only toast when server omits sms payload but email was provided', () => {
    showAppointmentConfirmationSmsToast(toast, '(555) 234-5678', 'jordan@email.com', null);
    expect(toast.email).toHaveBeenCalledWith('Confirmation emailed to your customer');
  });

  it('shows sms bubble when server omits sms payload but phone was provided', () => {
    showAppointmentConfirmationSmsToast(toast, '(555) 234-5678', '', null);
    expect(toast.sms).toHaveBeenCalledWith('Confirmation text sent to your customer', {
      type: 'success',
    });
  });
});
