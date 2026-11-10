import { notificationMinimalDisplayTitle } from '../utils/notificationMinimalTitle';

describe('notificationMinimalDisplayTitle', () => {
  it('returns New appointment request only when that is the stored title', () => {
    expect(
      notificationMinimalDisplayTitle('availability_booking', 'booking', 'New appointment request'),
    ).toBe('New appointment request');
    expect(
      notificationMinimalDisplayTitle('availability_booking', 'booking', 'New appointment'),
    ).toBe('New appointment');
    expect(
      notificationMinimalDisplayTitle('availability_booking', 'booking', 'Appointment created'),
    ).toBe('New appointment');
  });

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

  it('returns Invoice paid for a customer invoice payment', () => {
    expect(
      notificationMinimalDisplayTitle('customer_invoice_paid', 'invoice', 'Invoice paid'),
    ).toBe('Invoice paid');
  });

  it('returns Job assigned for assignment types before New appointment', () => {
    expect(notificationMinimalDisplayTitle('booking.assigned', 'booking', 'ignored')).toBe(
      'Job assigned',
    );
    expect(notificationMinimalDisplayTitle('custom.event', 'widget', 'Job assigned')).toBe(
      'Job assigned',
    );
  });

  it('falls back to trimmed title when unknown', () => {
    expect(notificationMinimalDisplayTitle('custom.event', 'widget', 'Hello world')).toBe(
      'Hello world',
    );
  });
});
