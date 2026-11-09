import { bookingPaymentFooter } from '../utils/bookingPaymentFooter';

describe('bookingPaymentFooter', () => {
  it('collapses a due amount that matches the total', () => {
    expect(
      bookingPaymentFooter({
        visible: true,
        variant: 'pay_in_person',
        status: 'Pay in person',
        detail: '$140.00 due',
        accessibilityLabel: 'Pay in person. Amount due $140.00.',
      }),
    ).toMatchObject({
      method: 'Pay in person',
      badge: 'Due',
      tone: 'due',
      detail: null,
    });
  });

  it('shows Due under pay in person when a deposit is still outstanding', () => {
    expect(
      bookingPaymentFooter({
        visible: true,
        variant: 'deposit',
        status: 'Deposit paid',
        detail: 'Pay in person · $40.00 due',
      }),
    ).toMatchObject({
      method: 'Pay in person',
      badge: 'Due',
      tone: 'due',
    });
  });

  it('marks a paid visit without repeating the dollar amount', () => {
    expect(
      bookingPaymentFooter({
        visible: true,
        variant: 'paid_full',
        status: 'Paid online',
        detail: '$140.00',
      }),
    ).toMatchObject({
      badge: 'Paid',
      tone: 'paid',
      detail: null,
    });
  });

  it('keeps a longer paid breakdown under the badge', () => {
    expect(
      bookingPaymentFooter({
        visible: true,
        variant: 'session_paid',
        status: 'Cash',
        detail: '$20.00 paid online · $80.00 via cash',
      }),
    ).toMatchObject({
      method: 'Cash',
      badge: 'Paid',
      tone: 'paid',
      detail: '$20.00 paid online · $80.00 via cash',
    });
  });

  it('hides a badge on a subscription visit', () => {
    expect(
      bookingPaymentFooter({
        visible: true,
        variant: 'membership',
        status: 'Subscription appointment',
        detail: null,
        showMembershipMark: true,
      }),
    ).toMatchObject({
      method: 'Subscription appointment',
      badge: null,
      detail: null,
    });
  });

  it('returns null when payment is hidden', () => {
    expect(bookingPaymentFooter({ visible: false, status: 'Pay in person' })).toBeNull();
    expect(bookingPaymentFooter(null)).toBeNull();
  });
});
