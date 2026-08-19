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

  it('builds multi-job schedule and price lines from job_details', () => {
    const model = buildBookingDetailsModel({
      service_name: 'Signature Shine',
      service_price_cents: 22500,
      duration_minutes: 180,
      scheduled_date: '2026-08-12',
      start_time: '09:00:00',
      visit_job_count: 2,
      job_details: [
        {
          clientJobId: 'j1',
          serviceName: 'Signature Shine',
          servicePriceOptionLabel: 'SUV',
          servicePriceCents: 22500,
          selectedAddOns: [{ id: 'a1', name: 'Pet hair', priceCents: 2500 }],
          durationMinutes: 135,
          vehicle: { year: '2022', make: 'Toyota', model: 'Highlander' },
        },
        {
          clientJobId: 'j2',
          serviceName: 'Touch-up paint',
          servicePriceCents: 7500,
          durationMinutes: 45,
          vehicle: { year: '2018', make: 'Honda', model: 'Civic' },
        },
      ],
    });

    expect(model.isMultiJob).toBe(true);
    expect(model.jobCount).toBe(2);
    expect(model.schedule.isMultiJob).toBe(true);
    expect(model.schedule.jobs).toHaveLength(2);
    expect(model.schedule.jobs[0]).toMatchObject({
      serviceName: 'Signature Shine',
      pricingOption: 'SUV',
      vehicleLine: '2022 Toyota Highlander',
    });
    expect(model.formattedPrice.jobs).toHaveLength(2);
    expect(model.formattedPrice.jobs[0]).toMatchObject({
      serviceName: 'Signature Shine',
      pricingOption: 'SUV',
      vehicleLine: '2022 Toyota Highlander',
      servicePriceLabel: '$225.00',
    });
    expect(model.formattedPrice.jobs[0].addOns[0]).toMatchObject({
      name: 'Pet hair',
      priceLabel: '$25.00',
    });
    expect(model.formattedPrice.jobs[1].servicePriceLabel).toBe('$75.00');
    expect(model.formattedPrice.total).toBe('$325.00');
    // Vehicles live under schedule job rows for multi-job visits
    expect(model.hasVehicle).toBe(false);
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
    expect(model.customer.phone).toBe('+1 (305) 444-1212');
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

  it('puts legacy vehicle on the Summary job card (no duplicate Vehicle section)', () => {
    const model = buildBookingDetailsModel({
      customer_vehicle_year: 2022,
      customer_vehicle_make: 'Honda',
      customer_vehicle_model: 'Civic',
    });
    expect(model.hasVehicle).toBe(false);
    expect(model.formattedPrice.jobs[0].vehicleLine).toContain('Honda');
  });

  it('puts legacy vehicle string on the Summary job card', () => {
    const model = buildBookingDetailsModel({ vehicle: ' 2019 Ford F-150 ' });
    expect(model.hasVehicle).toBe(false);
    expect(model.formattedPrice.jobs[0].vehicleLine).toBe('2019 Ford F-150');
  });

  it('builds Summary job cards from legacy addon_details', () => {
    const model = buildBookingDetailsModel({
      service_price_cents: 10000,
      service_name: 'Full detail',
      addon_details: {
        addons: [
          { id: 'a1', name: 'Pet hair removal', price_cents: 1500 },
          { id: 'a2', label: 'Seat shampoo', priceCents: 2500 },
        ],
      },
    });

    expect(model.hasJobDetails).toBe(false);
    expect(model.formattedPrice.jobs).toHaveLength(1);
    expect(model.formattedPrice.jobs[0]).toMatchObject({
      serviceName: 'Full detail',
      servicePriceLabel: '$100.00',
    });
    expect(model.formattedPrice.jobs[0].addOns).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'a1', name: 'Pet hair removal', priceLabel: '$15.00' }),
        expect.objectContaining({ id: 'a2', name: 'Seat shampoo', priceLabel: '$25.00' }),
      ]),
    );
    expect(model.formattedPrice.hasAddOns).toBe(true);
    expect(model.formattedPrice.total).toBe('$140.00');
  });

  it('reads add-ons from single-job job_details (not legacy addon_details)', () => {
    const model = buildBookingDetailsModel({
      service_name: 'Oil change',
      service_price_cents: 0,
      addon_details: null,
      job_details: [
        {
          clientJobId: 'j1',
          serviceName: 'Oil change',
          servicePriceOptionLabel: 'Synthetic',
          servicePriceCents: 8500,
          selectedAddOns: [{ id: 'addon-1', name: 'Wax', priceCents: 2500 }],
          durationMinutes: 80,
          vehicle: { year: '2020', make: 'Honda', model: 'Civic' },
        },
      ],
    });

    expect(model.hasJobDetails).toBe(true);
    expect(model.isMultiJob).toBe(false);
    expect(model.formattedPrice.jobs).toHaveLength(1);
    expect(model.formattedPrice.jobs[0].addOns[0]).toMatchObject({
      name: 'Wax',
      priceLabel: '$25.00',
    });
    expect(model.formattedPrice.total).toBe('$110.00');
    expect(model.hasVehicle).toBe(false);
    expect(model.formattedPrice.jobs[0].vehicleLine).toBe('2020 Honda Civic');
  });

  it('heals Summary add-ons from addon_details when job_details has none', () => {
    const model = buildBookingDetailsModel({
      service_name: 'Oil change',
      service_price_cents: 8500,
      addon_details: {
        addons: [{ id: 'addon-1', name: 'Wax', priceCents: 2500 }],
      },
      job_details: [
        {
          clientJobId: 'j1',
          serviceName: 'Oil change',
          servicePriceOptionLabel: 'Synthetic',
          servicePriceCents: 8500,
          durationMinutes: 80,
          vehicle: { year: '2020', make: 'Honda', model: 'Civic' },
        },
      ],
    });

    expect(model.hasJobDetails).toBe(true);
    expect(model.formattedPrice.hasAddOns).toBe(true);
    expect(model.formattedPrice.jobs[0].addOns).toEqual([
      expect.objectContaining({ name: 'Wax', priceLabel: '$25.00' }),
    ]);
    expect(model.formattedPrice.total).toBe('$110.00');
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

  it('includes sale/promo discount in price breakdown and total', () => {
    const model = buildBookingDetailsModel({
      service_price_cents: 10000,
      addon_details: {
        addons: [{ id: 'a1', name: 'Pet hair removal', price_cents: 2000 }],
      },
      discount_source: 'sale',
      discount_cents: 2400,
      discount_label: '20% OFF',
      payment: {
        totalAmountCents: 9600,
        currency: 'usd',
      },
    });

    expect(model.formattedPrice.hasDiscount).toBe(true);
    expect(model.formattedPrice.discount).toEqual({
      label: '20% OFF',
      value: '−$24.00',
    });
    expect(model.formattedPrice.total).toBe('$96.00');
  });

  it('does not invent additional fees when payment total is still pre-discount', () => {
    const model = buildBookingDetailsModel({
      service_price_cents: 8500,
      discount_source: 'sale',
      discount_cents: 2500,
      discount_label: 'Mobile Sale 2 — $25 off',
      payment: {
        paymentMethodSelected: 'none',
        totalAmountCents: 8500,
        remainingAmountCents: 8500,
        paidOnlineAmountCents: 0,
        sessionFeesTotalCents: 0,
        currency: 'usd',
      },
    });

    expect(model.formattedPrice.hasSessionFees).toBe(false);
    expect(model.formattedPrice.hasDiscount).toBe(true);
    expect(model.formattedPrice.total).toBe('$60.00');
    expect(model.payment.detail).toMatch(/60\.00/);
    expect(model.payment.detail).toMatch(/due/i);
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
    expect(model.payment.status).toBe('Tap to Pay');
    expect(model.payment.detail).toMatch(/115\.00/);
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
    expect(model.payment.detail).toMatch(/115\.00/);
    expect(model.formattedPrice.hasSessionFees).toBe(true);
    expect(model.formattedPrice.sessionFees[0].priceLabel).toBe('$15.00');
  });

  it('shows deposit status on Payment card when a partial online payment remains due', () => {
    const model = buildBookingDetailsModel({
      service_price_cents: 24225,
      payment: {
        paymentMethodSelected: 'pay_now',
        paidOnlineAmountCents: 200,
        remainingAmountCents: 24025,
        totalAmountCents: 24225,
        currency: 'usd',
      },
    });

    expect(model.payment.status).toBe('Deposit paid');
    expect(model.payment.detail).toBe('$240.25 due');
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
      service_price_cents: 10000,
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

  it('heals stale payment due after job prices change', () => {
    const model = buildBookingDetailsModel({
      service_price_cents: 21000,
      discount_cents: 0,
      visit_job_count: 2,
      job_details: [
        {
          serviceName: 'A',
          servicePriceCents: 21000,
          selectedAddOns: [{ id: 'a1', name: 'Pet', priceCents: 2000 }],
          durationMinutes: 60,
        },
        {
          serviceName: 'B',
          servicePriceCents: 27500,
          selectedAddOns: [],
          durationMinutes: 60,
        },
      ],
      payment: {
        paymentMethodSelected: 'none',
        paidOnlineAmountCents: 0,
        remainingAmountCents: 39900,
        totalAmountCents: 39900,
        currency: 'usd',
      },
    });

    expect(model.formattedPrice.total).toMatch(/505\.00/);
    expect(model.payment.detail).toMatch(/505\.00/);
    expect(model.payment.detail).toMatch(/due/i);
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

  it('membership payment shows subscription appointment copy', () => {
    const model = buildBookingDetailsModel({
      payment: {
        paymentMethodSelected: 'membership',
        paymentStatus: 'not_required',
        paidOnlineAmountCents: 0,
        remainingAmountCents: 0,
        totalAmountCents: 0,
        currency: 'usd',
      },
    });
    expect(model.payment.status).toBe('Subscription appointment');
    expect(model.payment.detail).toBeNull();
    expect(model.payment.showMembershipMark).toBe(true);
  });

  it('deposit variant: status + amount due without deposit amount', () => {
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
    expect(model.payment.detail).toBe('$50.00 due');
    expect(model.payment.detail).not.toMatch(/paid/i);
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
    expect(model.payment.detail).toBe('Pay in person · $70.00 due');
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
