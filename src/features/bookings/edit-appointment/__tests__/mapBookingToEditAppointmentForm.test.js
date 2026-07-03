import {
  bookingHasAddonDetails,
  bookingStartTimeToScheduleLabel,
  createEmptyEditAppointmentForm,
  inferEditAppointmentLocationType,
  mapBookingToEditAppointmentForm,
  matchCatalogServiceIdByName,
  resolveEditAppointmentAddonIds,
  resolveEditAppointmentPricingId,
} from '../utils/mapBookingToEditAppointmentForm';

describe('mapBookingToEditAppointmentForm', () => {
  const catalog = {
    services: [
      { id: 'svc-1', name: 'Signature Shine', isEnabled: true },
      { id: 'svc-2', name: 'Interior only', isEnabled: true },
    ],
    serviceRows: [
      {
        id: 'svc-1',
        price_cents: 12000,
        duration_minutes: 120,
        price_options_enabled: false,
      },
    ],
    addons: [{ id: 'addon-a', name: 'Pet hair removal', priceLabel: '$15' }],
    addonAssignments: [{ service_id: 'svc-1', addon_id: 'addon-a' }],
  };

  const shopAddressForm = {
    street: '100 Shop Way',
    unit: '',
    city: 'Miami',
    state: 'FL',
    zip: '33101',
  };

  it('maps booking fields into edit wizard state', () => {
    const form = mapBookingToEditAppointmentForm({
      booking: {
        service_id: 'svc-1',
        service_name: 'Signature Shine — SUV',
        service_price_cents: 12000,
        scheduled_date: '2026-05-20',
        start_time: '14:30:00',
        addon_details: {
          addons: [{ id: 'addon-a', name: 'Pet hair', priceCents: 1500 }],
        },
        customer_name: 'Alex Rivera',
        customer_email: 'alex@example.com',
        customer_phone: '3054441212',
        customer_street_address: '12 Ocean Dr',
        customer_city: 'Miami Beach',
        customer_state: 'FL',
        customer_zip: '33139',
        customer_vehicle_year: 2020,
        customer_vehicle_make: 'Honda',
        customer_vehicle_model: 'Civic',
        customer_notes: 'Side gate',
      },
      catalog,
      ownerHasPro: false,
      priceOptionRows: [],
      shopAddressForm,
      businessServiceMode: 'both',
    });

    expect(form).toMatchObject({
      selectedServiceId: 'svc-1',
      selectedPricingId: 'svc-1-create-flow-base',
      selectedAddonIds: ['addon-a'],
      selectedDateKey: '2026-05-20',
      selectedTime: '2:30 PM',
      customer: {
        fullName: 'Alex Rivera',
        email: 'alex@example.com',
        phone: '3054441212',
      },
      appointmentLocationType: 'mobile',
      address: {
        street: '12 Ocean Dr',
        city: 'Miami Beach',
        state: 'FL',
        zip: '33139',
      },
      vehicle: { year: '2020', make: 'Honda', model: 'Civic' },
      notes: 'Side gate',
    });
  });

  it('matches service by name when service_id is missing', () => {
    const form = mapBookingToEditAppointmentForm({
      booking: { service_name: 'Interior only' },
      catalog,
      ownerHasPro: false,
      priceOptionRows: [],
      shopAddressForm,
      businessServiceMode: 'mobile',
    });

    expect(form?.selectedServiceId).toBe('svc-2');
  });

  it('infers shop location when address matches business shop', () => {
    expect(
      inferEditAppointmentLocationType(
        {
          customer_street_address: '100 Shop Way',
          customer_city: 'Miami',
          customer_state: 'FL',
          customer_zip: '33101',
        },
        shopAddressForm,
        'both',
      ),
    ).toBe('shop');
  });

  it('converts sql start time to schedule label', () => {
    expect(bookingStartTimeToScheduleLabel('09:00:00')).toBe('9:00 AM');
    expect(bookingStartTimeToScheduleLabel('18:30:00')).toBe('6:30 PM');
  });

  it('matchCatalogServiceIdByName is case-insensitive', () => {
    expect(matchCatalogServiceIdByName(catalog.services, 'signature shine')).toBe('svc-1');
  });

  it('resolves tiered pricing id from service name label', () => {
    const tierCatalog = {
      ...catalog,
      serviceRows: [
        {
          id: 'svc-1',
          price_cents: 12000,
          duration_minutes: 120,
          price_options_enabled: true,
        },
      ],
    };
    const priceOptionRows = [
      {
        id: 'tier-sedan',
        name: 'Sedan',
        price_cents: 12000,
        duration_minutes: 120,
        is_active: true,
      },
      { id: 'tier-suv', name: 'SUV', price_cents: 15000, duration_minutes: 150, is_active: true },
    ];

    expect(
      resolveEditAppointmentPricingId({
        booking: {
          service_id: 'svc-1',
          service_name: 'Signature Shine — SUV',
          service_price_cents: 15000,
        },
        catalog: tierCatalog,
        ownerHasPro: true,
        priceOptionRows,
        serviceId: 'svc-1',
      }),
    ).toBe('tier-suv');
  });

  it('resolves tiered pricing id from price cents when labels differ', () => {
    const tierCatalog = {
      ...catalog,
      serviceRows: [
        {
          id: 'svc-1',
          price_cents: 12000,
          duration_minutes: 120,
          price_options_enabled: true,
        },
      ],
    };
    const priceOptionRows = [
      { id: 'tier-a', label: 'Small', price_cents: 12000, duration_minutes: 120, is_active: true },
      { id: 'tier-b', label: 'Large', price_cents: 15000, duration_minutes: 150, is_active: true },
    ];

    expect(
      resolveEditAppointmentPricingId({
        booking: {
          service_id: 'svc-1',
          service_name: 'Signature Shine',
          service_price_cents: 15000,
        },
        catalog: tierCatalog,
        ownerHasPro: true,
        priceOptionRows,
        serviceId: 'svc-1',
      }),
    ).toBe('tier-b');
  });

  it('resolves add-on ids from booking snapshot by catalog id', () => {
    expect(
      resolveEditAppointmentAddonIds({
        booking: {
          addon_details: {
            addons: [{ id: 'addon-a', name: 'Pet hair removal' }],
          },
        },
        catalogAddonsForService: [
          { id: 'addon-a', name: 'Pet hair removal', priceLabel: '$15' },
          { id: 'addon-b', name: 'Seat shampoo', priceLabel: '$25' },
        ],
      }),
    ).toEqual(['addon-a']);
  });

  it('resolves add-on ids by name when booking snapshot id differs', () => {
    expect(
      resolveEditAppointmentAddonIds({
        booking: {
          addon_details: {
            addons: [{ id: 'legacy-id', name: 'Seat shampoo' }],
          },
        },
        catalogAddonsForService: [{ id: 'addon-b', name: 'Seat shampoo', priceLabel: '$25' }],
      }),
    ).toEqual(['addon-b']);
  });

  it('returns null when booking is missing', () => {
    expect(
      mapBookingToEditAppointmentForm({
        booking: null,
        catalog,
        ownerHasPro: false,
        priceOptionRows: [],
        shopAddressForm,
        businessServiceMode: 'both',
      }),
    ).toBeNull();
  });

  it('bookingHasAddonDetails handles string json and empty shapes', () => {
    expect(bookingHasAddonDetails(null)).toBe(false);
    expect(bookingHasAddonDetails({ addons: [] })).toBe(false);
    expect(bookingHasAddonDetails(JSON.stringify({ addons: [{ id: 'a1', name: 'Wax' }] }))).toBe(
      true,
    );
  });

  it('createEmptyEditAppointmentForm provides blank wizard defaults', () => {
    expect(createEmptyEditAppointmentForm()).toMatchObject({
      selectedServiceId: null,
      selectedPricingId: null,
      selectedAddonIds: [],
      selectedDateKey: null,
      selectedTime: null,
      notes: '',
    });
  });

  it('defaults to shop location when booking has no customer address', () => {
    const form = mapBookingToEditAppointmentForm({
      booking: { service_id: 'svc-1', service_name: 'Signature Shine' },
      catalog,
      ownerHasPro: false,
      priceOptionRows: [],
      shopAddressForm,
      businessServiceMode: 'shop',
    });

    expect(form?.appointmentLocationType).toBe('shop');
    expect(form?.address).toEqual(shopAddressForm);
  });
});
