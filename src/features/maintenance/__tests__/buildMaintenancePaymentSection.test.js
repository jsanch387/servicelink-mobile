import { buildMaintenancePaymentSection } from '../utils/buildMaintenancePaymentSection';

describe('buildMaintenancePaymentSection', () => {
  it('hides payment for pending enrollments', () => {
    expect(
      buildMaintenancePaymentSection({
        status: 'enrolled_pending_customer',
        paymentStatus: 'pending',
        priceCents: 10000,
      }).visible,
    ).toBe(false);
  });

  it('shows paid online with amount only', () => {
    expect(
      buildMaintenancePaymentSection({
        status: 'accepted',
        paymentStatus: 'paid',
        priceCents: 10000,
      }),
    ).toEqual({
      visible: true,
      status: 'Paid online',
      detail: '$100',
      accessibilityLabel: 'Paid online. $100.',
    });
  });

  it('shows pay in person with amount due', () => {
    expect(
      buildMaintenancePaymentSection({
        status: 'accepted',
        paymentStatus: 'pay_in_person',
        priceCents: 8000,
      }),
    ).toEqual({
      visible: true,
      status: 'Pay in person',
      detail: '$80 due',
      accessibilityLabel: 'Pay in person. $80 due.',
    });
  });

  it('shows paid online when linked booking is completed', () => {
    expect(
      buildMaintenancePaymentSection({
        status: 'accepted',
        paymentStatus: 'paid',
        linkedBookingStatus: 'completed',
        priceCents: 5000,
      }),
    ).toEqual({
      visible: true,
      status: 'Paid online',
      detail: '$50',
      accessibilityLabel: 'Paid online. $50.',
    });
  });
});
