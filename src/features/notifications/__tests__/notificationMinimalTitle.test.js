import { notificationMinimalDisplayTitle } from '../utils/notificationMinimalTitle';

describe('notificationMinimalDisplayTitle', () => {
  it('returns New appointment for booking types', () => {
    expect(notificationMinimalDisplayTitle('booking.scheduled', 'booking', 'ignored')).toBe(
      'New appointment',
    );
  });

  it('returns New quote for quote types', () => {
    expect(notificationMinimalDisplayTitle('quote.requested', 'quote', 'x')).toBe('New quote');
  });

  it('returns New payment for payment-ish types', () => {
    expect(notificationMinimalDisplayTitle('payment.deposit', 'payment', 'x')).toBe('New payment');
  });

  it('falls back to trimmed title when unknown', () => {
    expect(notificationMinimalDisplayTitle('custom.event', 'widget', 'Hello world')).toBe(
      'Hello world',
    );
  });
});
