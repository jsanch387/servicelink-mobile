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
  });

  it('shows pay in person variant when method is pay_in_person and no online paid', () => {
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
    expect(model.payment.rows[0].value).toBe('Pay in person');
    expect(model.payment.rows[1].value).toMatch(/^Amount due: /);
    expect(model.payment.rows[1].value).toMatch(/100\.00/);
  });

  it('pay in person with zero total shows no amount due copy', () => {
    const model = buildBookingDetailsModel({
      payment: {
        paymentMethodSelected: 'pay_in_person',
        paidOnlineAmountCents: 0,
        remainingAmountCents: 0,
        totalAmountCents: 0,
        currency: 'usd',
      },
    });
    expect(model.payment.rows[1].value).toBe('No amount due for this appointment.');
  });

  it('shows deposit variant when online paid and remaining are both positive', () => {
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
    expect(model.payment.rows.map((r) => r.value)).toEqual([
      'Deposit paid',
      expect.stringMatching(/^Amount paid: /),
      expect.stringMatching(/^Amount due: /),
    ]);
    expect(model.payment.rows[1].value).toMatch(/50\.00/);
    expect(model.payment.rows[2].value).toMatch(/50\.00/);
  });

  it('shows paid in full when online paid positive and no remaining', () => {
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
    expect(model.payment.rows[0].value).toBe('Paid');
    expect(model.payment.rows[0].emphasize).toBe(true);
    expect(model.payment.rows[1].value).toMatch(/^Amount paid: /);
    expect(model.payment.rows[1].value).toMatch(/125\.00/);
  });

  it('pay_in_person with online paid uses deposit or paid_full, not pay_in_person headline', () => {
    const model = buildBookingDetailsModel({
      payment: {
        paymentMethodSelected: 'pay_in_person',
        paidOnlineAmountCents: 3000,
        remainingAmountCents: 7000,
        totalAmountCents: 10000,
        currency: 'usd',
      },
    });
    expect(model.payment.rows[0].value).toBe('Deposit paid');
  });

  it('shows other variant for pay_now with no online payment', () => {
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
    expect(model.payment.rows[0].value).toBe('No card payment through the app for this booking.');
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
    expect(model.payment.rows[0].value).toBe('Pay in person');
  });
});
