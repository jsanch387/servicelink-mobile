import {
  formatJobVehicleLine,
  parseJobDetailsFromBooking,
} from '../booking-details/utils/parseJobDetailsFromBooking';

describe('parseJobDetailsFromBooking', () => {
  it('returns empty for missing details', () => {
    expect(parseJobDetailsFromBooking(null)).toEqual([]);
    expect(parseJobDetailsFromBooking(undefined)).toEqual([]);
    expect(parseJobDetailsFromBooking('')).toEqual([]);
  });

  it('parses a jobs array with catalog + custom jobs', () => {
    const jobs = parseJobDetailsFromBooking([
      {
        clientJobId: 'job-1',
        serviceId: 'svc-1',
        serviceName: 'Signature Shine',
        servicePriceOptionLabel: 'SUV',
        servicePriceCents: 22500,
        selectedAddOns: [{ id: 'a1', name: 'Pet hair', priceCents: 2500 }],
        durationMinutes: 135,
        vehicle: { year: '2022', make: 'Toyota', model: 'Highlander' },
      },
      {
        serviceName: 'Touch-up paint',
        servicePriceCents: 7500,
        durationMinutes: 45,
        vehicle: { year: '2018', make: 'Honda', model: 'Civic' },
      },
    ]);

    expect(jobs).toHaveLength(2);
    expect(jobs[0]).toMatchObject({
      id: 'job-1',
      serviceName: 'Signature Shine',
      pricingOption: 'SUV',
      servicePrice: 225,
      vehicleLine: '2022 Toyota Highlander',
    });
    expect(jobs[0].addOns[0]).toMatchObject({ name: 'Pet hair', price: 25 });
    expect(jobs[1]).toMatchObject({
      serviceName: 'Touch-up paint',
      pricingOption: null,
      servicePrice: 75,
      vehicleLine: '2018 Honda Civic',
    });
  });

  it('accepts { jobs: [...] } wrapper and snake_case fields', () => {
    const jobs = parseJobDetailsFromBooking({
      jobs: [
        {
          service_name: 'Wash',
          service_price_cents: 5000,
          service_price_option_label: 'Standard',
        },
      ],
    });
    expect(jobs).toHaveLength(1);
    expect(jobs[0].serviceName).toBe('Wash');
    expect(jobs[0].servicePrice).toBe(50);
    expect(jobs[0].pricingOption).toBeNull();
  });

  it('formats vehicle lines', () => {
    expect(formatJobVehicleLine({ year: '2020', make: 'Ford', model: 'F-150' })).toBe(
      '2020 Ford F-150',
    );
    expect(formatJobVehicleLine(null)).toBe('');
  });
});
