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

  it('maps customer_notes to notes for display', () => {
    const model = buildBookingDetailsModel({
      customer_notes: 'Please ring doorbell',
    });
    expect(model.notes).toBe('Please ring doorbell');
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
});
