import { resolveSessionPaymentForDisplay } from '../utils/resolveSessionPaymentForDisplay';

describe('resolveSessionPaymentForDisplay', () => {
  it('detects tap to pay from stripe payment intent id', () => {
    expect(
      resolveSessionPaymentForDisplay(
        {
          paymentStatus: 'paid',
          paymentMethodSelected: 'pay_in_person',
          paidOnlineAmountCents: 0,
          remainingAmountCents: 0,
          totalAmountCents: 11500,
          sessionPaymentAmountCents: 0,
          sessionPaymentStripeIntentId: 'pi_123',
        },
        'completed',
      ),
    ).toEqual({
      sessionMethod: 'tap_to_pay',
      sessionPaidCents: 11500,
      paidOnlineCents: 0,
    });
  });

  it('relocates mis-recorded tap to pay amount from paid_online on in-person bookings', () => {
    expect(
      resolveSessionPaymentForDisplay(
        {
          paymentStatus: 'paid',
          paymentMethodSelected: 'pay_in_person',
          paidOnlineAmountCents: 11500,
          remainingAmountCents: 0,
          totalAmountCents: 11500,
          sessionPaymentAmountCents: 0,
        },
        'completed',
      ),
    ).toEqual({
      sessionMethod: 'tap_to_pay',
      sessionPaidCents: 11500,
      paidOnlineCents: 0,
    });
  });

  it('detects tap to pay when only job_status is completed', () => {
    expect(
      resolveSessionPaymentForDisplay(
        {
          paymentStatus: 'not_required',
          paymentMethodSelected: 'pay_in_person',
          paidOnlineAmountCents: 0,
          remainingAmountCents: 0,
          totalAmountCents: 11500,
          sessionPaymentAmountCents: 0,
        },
        'confirmed',
        'completed',
      ),
    ).toEqual({
      sessionMethod: 'tap_to_pay',
      sessionPaidCents: 11500,
      paidOnlineCents: 0,
    });
  });
});
