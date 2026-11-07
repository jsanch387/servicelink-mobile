import { applyCheckoutSnapshotToBooking } from '../utils/applyCheckoutSnapshotToBooking';

describe('applyCheckoutSnapshotToBooking', () => {
  it('adds session fees and tap to pay payment when server rows are missing', () => {
    const result = applyCheckoutSnapshotToBooking(
      {
        id: 'b-1',
        status: 'completed',
        job_status: 'completed',
        service_price_cents: 10000,
        addon_details: null,
      },
      {
        sessionFees: [{ label: 'Extra soil', amount: 15 }],
        sessionPayment: {
          method: 'tap_to_pay',
          amount: 115,
          stripePaymentIntentId: 'pi_123',
        },
      },
    );

    expect(result.session_fee_lines).toEqual([
      expect.objectContaining({ label: 'Extra soil', amount_cents: 1500 }),
    ]);
    expect(result.payment.sessionPaymentMethod).toBe('tap_to_pay');
    expect(result.payment.sessionPaymentAmountCents).toBe(11500);
    expect(result.payment.totalAmountCents).toBe(11500);
  });

  it('subtracts booking discount when setting checkout total', () => {
    const result = applyCheckoutSnapshotToBooking(
      {
        id: 'b-2',
        status: 'completed',
        service_price_cents: 10000,
        discount_cents: 2000,
        addon_details: null,
      },
      {
        sessionFees: [{ label: 'Extra soil', amount: 15 }],
        sessionPayment: {
          method: 'cash',
          amount: 95,
        },
      },
    );

    expect(result.payment.totalAmountCents).toBe(9500);
    expect(result.payment.sessionPaymentAmountCents).toBe(9500);
  });

  it('stores a visit discount without lowering the appointment total', () => {
    const result = applyCheckoutSnapshotToBooking(
      {
        id: 'b-3',
        status: 'completed',
        service_price_cents: 10000,
        addon_details: null,
      },
      {
        sessionFees: [
          { label: 'Travel', amount: 15, kind: 'fee' },
          { label: 'Deposit', amount: -50, kind: 'discount' },
        ],
        sessionPayment: { method: 'cash', amount: 65 },
      },
    );

    expect(result.session_fee_lines).toEqual([
      expect.objectContaining({ label: 'Travel', kind: 'fee', amount_cents: 1500 }),
      expect.objectContaining({ label: 'Deposit', kind: 'discount', amount_cents: 5000 }),
    ]);
    expect(result.payment.sessionFeesTotalCents).toBe(1500);
    expect(result.payment.sessionDiscountsTotalCents).toBe(5000);
    expect(result.payment.totalAmountCents).toBe(11500);
  });

  it('keeps a tap to pay tip off the appointment total and out of the fee lines', () => {
    const result = applyCheckoutSnapshotToBooking(
      {
        id: 'b-4',
        status: 'completed',
        service_price_cents: 10000,
        addon_details: null,
      },
      {
        sessionFees: [],
        sessionPayment: {
          method: 'tap_to_pay',
          amount: 120,
          stripePaymentIntentId: 'pi_tip',
        },
        tipCents: 2000,
      },
    );

    expect(result.session_fee_lines).toEqual([]);
    expect(result.payment.tipCents).toBe(2000);
    expect(result.payment.totalAmountCents).toBe(10000);
    expect(result.payment.sessionPaymentAmountCents).toBe(12000);
  });
});
