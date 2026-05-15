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

  it('hides payment section when booking has no merged payment summary', () => {
    const model = buildBookingDetailsModel({
      service_price_cents: 8000,
    });
    expect(model.payment.visible).toBe(false);
    expect(model.payment.banner).toBeNull();
  });

  it('pay in person: banner + amount due line', () => {
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
    expect(model.payment.banner?.title).toBe('Pay in person');
    expect(model.payment.banner?.tone).toBe('neutral');
    expect(model.payment.lines).toHaveLength(1);
    expect(model.payment.lines[0].label).toBe('Amount due');
    expect(model.payment.lines[0].value).toMatch(/100\.00/);
    expect(model.payment.lines[0].emphasize).toBe(true);
  });

  it('pay in person with zero total shows balance line', () => {
    const model = buildBookingDetailsModel({
      payment: {
        paymentMethodSelected: 'pay_in_person',
        paidOnlineAmountCents: 0,
        remainingAmountCents: 0,
        totalAmountCents: 0,
        currency: 'usd',
      },
    });
    expect(model.payment.lines[0].label).toBe('Balance');
    expect(model.payment.lines[0].value).toBe('No charge for this visit');
  });

  it('deposit variant: banner + paid / due lines', () => {
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
    expect(model.payment.banner?.title).toBe('Deposit received');
    expect(model.payment.lines.map((l) => l.label)).toEqual(['Paid online', 'Still due']);
    expect(model.payment.lines[0].value).toMatch(/50\.00/);
    expect(model.payment.lines[1].value).toMatch(/50\.00/);
    expect(model.payment.lines[1].emphasize).toBe(true);
  });

  it('paid in full: success banner + total line', () => {
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
    expect(model.payment.banner?.title).toBe('Paid in full');
    expect(model.payment.banner?.tone).toBe('success');
    expect(model.payment.lines[0].label).toBe('Total paid');
    expect(model.payment.lines[0].value).toMatch(/125\.00/);
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
    expect(model.payment.banner?.title).toBe('Deposit received');
  });

  it('other variant for pay_now with no online payment', () => {
    const model = buildBookingDetailsModel({
      payment: {
        paymentMethodSelected: 'pay_now',
        paidOnlineAmountCents: 0,
        remainingAmountCents: 10000,
        totalAmountCents: 10000,
        currency: 'usd',
      },
    });
    expect(model.payment.visible).toBe(true);
    expect(model.payment.variant).toBe('other');
    expect(model.payment.banner?.title).toBe('No app card charge');
    expect(model.payment.lines).toHaveLength(0);
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
    expect(model.payment.banner?.title).toBe('Pay in person');
    expect(model.payment.lines[0].value).toMatch(/150\.00/);
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
    expect(model.payment.banner?.title).toBe('Pay in person');
    expect(model.payment.lines[0].label).toBe('Amount due');
  });
});
