import { pickLastKnownCustomerAddress } from '../customer-details/utils/pickLastKnownCustomerAddress';

describe('pickLastKnownCustomerAddress', () => {
  it('returns null when no bookings have a street', () => {
    expect(pickLastKnownCustomerAddress([])).toBeNull();
    expect(
      pickLastKnownCustomerAddress([
        {
          scheduled_date: '2026-03-01',
          start_time: '09:00:00',
          customer_city: 'Austin',
        },
      ]),
    ).toBeNull();
  });

  it('returns the most recent booking address by scheduled date/time', () => {
    const out = pickLastKnownCustomerAddress([
      {
        scheduled_date: '2026-01-01',
        start_time: '10:00:00',
        service_location_type: 'mobile',
        customer_street_address: '100 Old St',
        customer_unit_apt: '',
        customer_city: 'Austin',
        customer_state: 'tx',
        customer_zip: '78701',
      },
      {
        scheduled_date: '2026-03-15',
        start_time: '14:00:00',
        service_location_type: 'mobile',
        customer_street_address: '  200 New Ave  ',
        customer_unit_apt: ' Apt 3 ',
        customer_city: ' Austin ',
        customer_state: 'tx',
        customer_zip: '78704',
      },
      {
        scheduled_date: '2026-02-01',
        start_time: '09:00:00',
        service_location_type: 'mobile',
        customer_street_address: '150 Mid Rd',
        customer_city: 'Austin',
        customer_state: 'TX',
        customer_zip: '78702',
      },
    ]);

    expect(out).toEqual({
      street: '200 New Ave',
      unit: 'Apt 3',
      city: 'Austin',
      state: 'TX',
      zip: '78704',
    });
  });

  it('skips shop bookings even when they are the most recent', () => {
    const out = pickLastKnownCustomerAddress([
      {
        scheduled_date: '2026-04-01',
        start_time: '10:00:00',
        service_location_type: 'shop',
        customer_street_address: '1 Shop Way',
        customer_city: 'Austin',
        customer_state: 'TX',
        customer_zip: '78701',
      },
      {
        scheduled_date: '2026-01-01',
        start_time: '10:00:00',
        service_location_type: 'mobile',
        customer_street_address: '12 Ocean Dr',
        customer_unit_apt: null,
        customer_city: 'Miami',
        customer_state: 'FL',
        customer_zip: '33139',
      },
    ]);

    expect(out).toEqual({
      street: '12 Ocean Dr',
      unit: '',
      city: 'Miami',
      state: 'FL',
      zip: '33139',
    });
  });

  it('skips legacy bookings whose address matches the shop', () => {
    const shopAddress = {
      street: '1 Shop Way',
      unit: '',
      city: 'Austin',
      state: 'TX',
      zip: '78701',
    };
    const out = pickLastKnownCustomerAddress(
      [
        {
          scheduled_date: '2026-04-01',
          start_time: '10:00:00',
          // No service_location_type — legacy row
          customer_street_address: '1 Shop Way',
          customer_city: 'Austin',
          customer_state: 'TX',
          customer_zip: '78701',
        },
        {
          scheduled_date: '2026-01-01',
          start_time: '10:00:00',
          customer_street_address: '99 Home St',
          customer_city: 'Austin',
          customer_state: 'TX',
          customer_zip: '78704',
        },
      ],
      { shopAddress },
    );

    expect(out).toEqual({
      street: '99 Home St',
      unit: '',
      city: 'Austin',
      state: 'TX',
      zip: '78704',
    });
  });

  it('returns null when only shop addresses exist', () => {
    expect(
      pickLastKnownCustomerAddress([
        {
          scheduled_date: '2026-04-01',
          start_time: '10:00:00',
          service_location_type: 'shop',
          customer_street_address: '1 Shop Way',
          customer_city: 'Austin',
          customer_state: 'TX',
          customer_zip: '78701',
        },
      ]),
    ).toBeNull();
  });

  it('skips bookings without street and still finds an older address', () => {
    const out = pickLastKnownCustomerAddress([
      {
        scheduled_date: '2026-04-01',
        start_time: '10:00:00',
        service_location_type: 'mobile',
        customer_street_address: '',
        customer_city: 'Austin',
      },
      {
        scheduled_date: '2026-01-01',
        start_time: '10:00:00',
        service_location_type: 'mobile',
        customer_street_address: '12 Ocean Dr',
        customer_unit_apt: null,
        customer_city: 'Miami',
        customer_state: 'FL',
        customer_zip: '33139',
      },
    ]);

    expect(out).toEqual({
      street: '12 Ocean Dr',
      unit: '',
      city: 'Miami',
      state: 'FL',
      zip: '33139',
    });
  });
});
