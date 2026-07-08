import { buildBookingDetailsModel } from '../booking-details/utils/buildBookingDetailsModel';

describe('buildBookingDetailsModel', () => {
  it('formats duration in hours and minutes', () => {
    const model = buildBookingDetailsModel({
      duration_minutes: 90,
      scheduled_date: '2026-04-23',
      start_time: '10:00:00',
    });
    expect(model.schedule.duration).toBe('1 hr 30 min');
  });

  it('splits combined service name into title and pricing option', () => {
    const model = buildBookingDetailsModel({
      service_name: 'Signature Shine — SUV',
    });
    expect(model.schedule.serviceName).toBe('Signature Shine');
    expect(model.schedule.pricingOption).toBe('SUV');
  });

  it('leaves pricing option null when service name has no tier', () => {
    const model = buildBookingDetailsModel({
      service_name: 'Full detail',
    });
    expect(model.schedule.serviceName).toBe('Full detail');
    expect(model.schedule.pricingOption).toBeNull();
  });

  it('uses singular hr and plural hrs', () => {
    expect(buildBookingDetailsModel({ duration_minutes: 60 }).schedule.duration).toBe('1 hr');
    expect(buildBookingDetailsModel({ duration_minutes: 120 }).schedule.duration).toBe('2 hrs');
  });

  it('formats minutes-only duration', () => {
    expect(buildBookingDetailsModel({ duration_minutes: 30 }).schedule.duration).toBe('30 min');
  });

  it('formats customer phone for US display', () => {
    const model = buildBookingDetailsModel({
      customer_phone: '3054441212',
    });
    expect(model.customer.phone).toBe('(305) 444-1212');
  });

  it('leaves customer phone and email empty when not on the booking', () => {
    const model = buildBookingDetailsModel({
      customer_name: 'Alex Rivera',
    });
    expect(model.customer.name).toBe('Alex Rivera');
    expect(model.customer.phone).toBe('');
    expect(model.customer.email).toBe('');
  });

  it('maps customer_notes to notes for display', () => {
    const model = buildBookingDetailsModel({
      customer_notes: 'Please ring doorbell',
    });
    expect(model.notes).toBe('Please ring doorbell');
  });

  it('returns empty notes when missing or whitespace', () => {
    expect(buildBookingDetailsModel({}).notes).toBe('');
    expect(buildBookingDetailsModel({ customer_notes: '   ' }).notes).toBe('');
  });

  it('exposes hasVehicle false and empty vehicle when no vehicle fields', () => {
    const model = buildBookingDetailsModel({ customer_name: 'Pat' });
    expect(model.hasVehicle).toBe(false);
    expect(model.vehicle).toBe('');
  });

  it('sets hasVehicle from customer vehicle fields', () => {
    const model = buildBookingDetailsModel({
      customer_vehicle_year: 2022,
      customer_vehicle_make: 'Honda',
      customer_vehicle_model: 'Civic',
    });
    expect(model.hasVehicle).toBe(true);
    expect(model.vehicle).toContain('Honda');
  });

  it('sets hasVehicle from legacy vehicle string', () => {
    const model = buildBookingDetailsModel({ vehicle: ' 2019 Ford F-150 ' });
    expect(model.hasVehicle).toBe(true);
    expect(model.vehicle).toBe('2019 Ford F-150');
  });

  it('parses addon_details for price breakdown rows', () => {
    const model = buildBookingDetailsModel({
      service_price_cents: 10000,
      addon_details: {
        addons: [
          { id: 'a1', name: 'Pet hair removal', price_cents: 1500 },
          { id: 'a2', label: 'Seat shampoo', priceCents: 2500 },
        ],
      },
    });

    expect(model.formattedPrice.hasAddOns).toBe(true);
    expect(model.formattedPrice.addOns).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'a1', name: 'Pet hair removal', priceLabel: '$15.00' }),
        expect.objectContaining({ id: 'a2', name: 'Seat shampoo', priceLabel: '$25.00' }),
      ]),
    );
    expect(model.formattedPrice.total).toBe('$140.00');
  });

  it('includes session fee lines in price breakdown and total', () => {
    const model = buildBookingDetailsModel({
      service_price_cents: 10000,
      session_fee_lines: [
        { id: 'fee-1', label: 'Extra soil removal', amount_cents: 1500 },
        { id: 'fee-2', label: 'Engine bay detail', amount_cents: 2500 },
      ],
      payment: {
        totalAmountCents: 14000,
        sessionFeesTotalCents: 4000,
        currency: 'usd',
      },
    });

    expect(model.formattedPrice.hasSessionFees).toBe(true);
    expect(model.formattedPrice.sessionFees).toEqual([
      expect.objectContaining({ id: 'fee-1', name: 'Extra soil removal', priceLabel: '$15.00' }),
      expect.objectContaining({ id: 'fee-2', name: 'Engine bay detail', priceLabel: '$25.00' }),
    ]);
    expect(model.formattedPrice.total).toBe('$140.00');
  });

  it('falls back to payment session fee total when line rows are unavailable', () => {
    const model = buildBookingDetailsModel({
      service_price_cents: 8000,
      payment: {
        totalAmountCents: 9500,
        sessionFeesTotalCents: 1500,
        currency: 'usd',
      },
    });

    expect(model.formattedPrice.hasSessionFees).toBe(true);
    expect(model.formattedPrice.sessionFees).toEqual([
      expect.objectContaining({ name: 'Additional fees', priceLabel: '$15.00' }),
    ]);
    expect(model.formattedPrice.total).toBe('$95.00');
  });

  it('shows Tap to Pay in payment section after complete checkout', () => {
    const model = buildBookingDetailsModel({
      status: 'completed',
      service_price_cents: 10000,
      payment: {
        paymentStatus: 'paid',
        totalAmountCents: 10000,
        paidOnlineAmountCents: 0,
        remainingAmountCents: 0,
        sessionPaymentMethod: 'tap_to_pay',
        sessionPaymentAmountCents: 10000,
        currency: 'usd',
      },
    });

    expect(model.payment.visible).toBe(true);
    expect(model.payment.variant).toBe('session_paid');
    expect(model.payment.status).toBe('Tap to Pay');
    expect(model.payment.detail).toMatch(/100\.00/);
  });

  it('shows completed price breakdown with session fees and tap to pay adjustment', () => {
    const model = buildBookingDetailsModel({
      status: 'completed',
      service_price_cents: 10000,
      session_fee_lines: [{ id: 'fee-1', label: 'Extra soil', amount_cents: 1500 }],
      payment: {
        paymentStatus: 'paid',
        totalAmountCents: 11500,
        sessionFeesTotalCents: 1500,
        paidOnlineAmountCents: 0,
        remainingAmountCents: 0,
        sessionPaymentMethod: 'tap_to_pay',
        sessionPaymentAmountCents: 11500,
        currency: 'usd',
      },
    });

    expect(model.formattedPrice.sessionFees).toEqual([
      expect.objectContaining({ name: 'Extra soil', priceLabel: '$15.00' }),
    ]);
    expect(model.formattedPrice.total).toBe('$115.00');
    expect(model.formattedPrice.paymentAdjustments).toEqual([
      expect.objectContaining({ label: 'Paid with card', value: '−$115.00' }),
    ]);
  });

  it('infers session fees on completed booking when only total was updated server-side', () => {
    const model = buildBookingDetailsModel({
      status: 'completed',
      service_price_cents: 10000,
      payment: {
        paymentStatus: 'paid',
        totalAmountCents: 11500,
        paidOnlineAmountCents: 0,
        remainingAmountCents: 0,
        sessionPaymentMethod: 'tap_to_pay',
        sessionPaymentAmountCents: 11500,
        currency: 'usd',
      },
    });

    expect(model.formattedPrice.hasSessionFees).toBe(true);
    expect(model.formattedPrice.sessionFees[0].name).toBe('Additional fees');
    expect(model.formattedPrice.sessionFees[0].priceLabel).toBe('$15.00');
    expect(model.formattedPrice.total).toBe('$115.00');
  });

  it('renders Signature Shinee tap-to-pay checkout with Dirt fee from Supabase shape', () => {
    const model = buildBookingDetailsModel({
      id: '8896bb6a-6a8f-4870-b221-bc2e6dd56e38',
      status: 'completed',
      job_status: 'completed',
      service_price_cents: 200,
      service_name: 'Signature Shinee — Sedan/Coupe',
      session_fee_lines: [{ id: 'fee-1', label: 'Dirt', amount_cents: 100, sort_order: 0 }],
      payment: {
        paymentStatus: 'paid_full',
        paymentMethodSelected: 'pay_in_person',
        totalAmountCents: 300,
        paidOnlineAmountCents: 0,
        remainingAmountCents: 0,
        sessionFeesTotalCents: 100,
        sessionPaymentMethod: 'tap_to_pay',
        sessionPaymentAmountCents: 300,
        currency: 'usd',
      },
    });

    expect(model.formattedPrice.servicePrice).toBe('$2.00');
    expect(model.formattedPrice.sessionFees).toEqual([
      expect.objectContaining({ name: 'Dirt', priceLabel: '$1.00' }),
    ]);
    expect(model.formattedPrice.total).toBe('$3.00');
    expect(model.payment.status).toBe('Tap to Pay');
  });

  it('shows Tap to Pay when server stored the collection under paid_online on pay_in_person', () => {
    const model = buildBookingDetailsModel({
      status: 'completed',
      service_price_cents: 10000,
      payment: {
        paymentStatus: 'paid',
        paymentMethodSelected: 'pay_in_person',
        totalAmountCents: 11500,
        paidOnlineAmountCents: 11500,
        remainingAmountCents: 0,
        currency: 'usd',
      },
    });

    expect(model.payment.status).toBe('Tap to Pay');
    expect(model.payment.variant).toBe('session_paid');
    expect(model.formattedPrice.hasSessionFees).toBe(true);
    expect(model.formattedPrice.sessionFees[0].priceLabel).toBe('$15.00');
    expect(model.formattedPrice.paymentAdjustments).toEqual([
      expect.objectContaining({ label: 'Paid with card', value: '−$115.00' }),
    ]);
  });

  it('hides payment section when booking has no merged payment summary', () => {
    const model = buildBookingDetailsModel({
      service_price_cents: 8000,
    });
    expect(model.payment.visible).toBe(false);
    expect(model.payment.status).toBe('');
  });

  it('pay in person: status + amount due', () => {
    const model = buildBookingDetailsModel({
      payment: {
        paymentMethodSelected: 'pay_in_person',
        paidOnlineAmountCents: 0,
        remainingAmountCents: 10000,
        totalAmountCents: 10000,
        currency: 'usd',
      },
    });
    expect(model.payment.visible).toBe(true);
    expect(model.payment.variant).toBe('pay_in_person');
    expect(model.payment.status).toBe('Pay in person');
    expect(model.payment.detail).toMatch(/100\.00/);
    expect(model.payment.detail).toMatch(/due/i);
    expect(model.payment.accessibilityLabel).toMatch(/Pay in person/);
  });

  it('pay in person with zero total shows no charge', () => {
    const model = buildBookingDetailsModel({
      payment: {
        paymentMethodSelected: 'pay_in_person',
        paidOnlineAmountCents: 0,
        remainingAmountCents: 0,
        totalAmountCents: 0,
        currency: 'usd',
      },
    });
    expect(model.payment.status).toBe('Pay in person');
    expect(model.payment.detail).toBe('No charge');
  });

  it('deposit variant: status + paid and due on one line', () => {
    const model = buildBookingDetailsModel({
      payment: {
        paymentMethodSelected: 'pay_now',
        paidOnlineAmountCents: 5000,
        remainingAmountCents: 5000,
        totalAmountCents: 10000,
        currency: 'usd',
      },
    });
    expect(model.payment.visible).toBe(true);
    expect(model.payment.variant).toBe('deposit');
    expect(model.payment.status).toBe('Deposit paid');
    expect(model.payment.detail).toMatch(/50\.00/);
    expect(model.payment.detail).toMatch(/due/i);
    expect(model.payment.detail).toMatch(/paid/i);
  });

  it('paid in full: Paid online + amount', () => {
    const model = buildBookingDetailsModel({
      payment: {
        paymentMethodSelected: 'pay_now',
        paidOnlineAmountCents: 12500,
        remainingAmountCents: 0,
        totalAmountCents: 12500,
        currency: 'usd',
      },
    });
    expect(model.payment.visible).toBe(true);
    expect(model.payment.variant).toBe('paid_full');
    expect(model.payment.status).toBe('Paid online');
    expect(model.payment.detail).toMatch(/125\.00/);
  });

  it('pay_in_person with online paid uses deposit variant', () => {
    const model = buildBookingDetailsModel({
      payment: {
        paymentMethodSelected: 'pay_in_person',
        paidOnlineAmountCents: 3000,
        remainingAmountCents: 7000,
        totalAmountCents: 10000,
        currency: 'usd',
      },
    });
    expect(model.payment.variant).toBe('deposit');
    expect(model.payment.status).toBe('Deposit paid');
  });

  it('hides payment for pay_now with no online payment (ambiguous state)', () => {
    const model = buildBookingDetailsModel({
      payment: {
        paymentMethodSelected: 'pay_now',
        paidOnlineAmountCents: 0,
        remainingAmountCents: 10000,
        totalAmountCents: 10000,
        currency: 'usd',
      },
    });
    expect(model.payment.visible).toBe(false);
    expect(model.payment.variant).toBeNull();
  });

  it('method none (owner manual) uses pay in person presentation', () => {
    const model = buildBookingDetailsModel({
      payment: {
        paymentMethodSelected: 'none',
        paidOnlineAmountCents: 0,
        remainingAmountCents: 15000,
        totalAmountCents: 15000,
        currency: 'usd',
      },
    });
    expect(model.payment.variant).toBe('pay_in_person');
    expect(model.payment.status).toBe('Pay in person');
    expect(model.payment.detail).toMatch(/150\.00/);
  });

  it('accepts snake_case payment fields from raw rows', () => {
    const model = buildBookingDetailsModel({
      payment: {
        payment_method_selected: 'pay_in_person',
        paid_online_amount_cents: 0,
        remaining_amount_cents: 5000,
        total_amount_cents: 5000,
        currency: 'usd',
      },
    });
    expect(model.payment.status).toBe('Pay in person');
    expect(model.payment.detail).toMatch(/50\.00/);
    expect(model.payment.detail).toMatch(/due/i);
  });
});
