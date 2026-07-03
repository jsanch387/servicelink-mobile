import { buildEditBookingUpdatePayload } from '../utils/buildEditBookingUpdatePayload';

describe('buildEditBookingUpdatePayload', () => {
  const baseArgs = {
    selectedService: { name: 'Oil change' },
    selectedServiceId: 'svc-1',
    selectedPricingOption: { label: 'Synthetic', priceCents: 8500, durationMinutes: 60 },
    selectedAddonRows: [{ id: 'addon-1', name: 'Wax', priceLabel: '$25', durationMinutes: 20 }],
    totalDurationMinutes: 80,
    selectedDateKey: '2026-07-15',
    selectedTime: '2:30 PM',
    customer: {
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      phone: '5123214324',
    },
    address: {
      street: '12 Ocean Dr',
      unit: 'Apt 2',
      city: 'Miami',
      state: 'fl',
      zip: '33101',
    },
    vehicle: { year: '2020', make: 'Honda', model: 'Civic' },
    notes: 'Side gate',
    appointmentLocationType: 'mobile',
  };

  it('maps wizard state to bookings columns', () => {
    const payload = buildEditBookingUpdatePayload(baseArgs);

    expect(payload).toMatchObject({
      scheduled_date: '2026-07-15',
      start_time: '14:30:00',
      duration_minutes: 80,
      service_id: 'svc-1',
      service_name: 'Oil change — Synthetic',
      service_price_cents: 8500,
      customer_name: 'Jane Doe',
      customer_email: 'jane@example.com',
      customer_phone: '5123214324',
      customer_street_address: '12 Ocean Dr',
      customer_unit_apt: 'Apt 2',
      customer_city: 'Miami',
      customer_state: 'FL',
      customer_zip: '33101',
      customer_vehicle_year: '2020',
      customer_vehicle_make: 'Honda',
      customer_vehicle_model: 'Civic',
      customer_notes: 'Side gate',
      service_location_type: 'mobile',
    });
    expect(payload.addon_details.addons).toHaveLength(1);
    expect(payload.addon_details.addons[0]).toMatchObject({
      id: 'addon-1',
      name: 'Wax',
      priceCents: 2500,
    });
  });

  it('sets addon_details null when none selected', () => {
    const payload = buildEditBookingUpdatePayload({
      ...baseArgs,
      selectedAddonRows: [],
    });
    expect(payload.addon_details).toBeNull();
  });

  it('maps shop location and trims optional fields', () => {
    const payload = buildEditBookingUpdatePayload({
      ...baseArgs,
      selectedServiceId: '',
      selectedPricingOption: null,
      customer: { fullName: '  Jane  ', email: '', phone: '5123214324' },
      notes: '  ',
      appointmentLocationType: 'shop',
    });

    expect(payload.service_id).toBeNull();
    expect(payload.service_name).toBe('Oil change');
    expect(payload.service_price_cents).toBe(0);
    expect(payload.customer_name).toBe('Jane');
    expect(payload.customer_email).toBe('');
    expect(payload.customer_notes).toBe('');
    expect(payload.service_location_type).toBe('shop');
  });

  it('normalizes midnight and noon times', () => {
    const midnight = buildEditBookingUpdatePayload({ ...baseArgs, selectedTime: '12:00 AM' });
    const noon = buildEditBookingUpdatePayload({ ...baseArgs, selectedTime: '12:00 PM' });

    expect(midnight.start_time).toBe('00:00:00');
    expect(noon.start_time).toBe('12:00:00');
  });
});
