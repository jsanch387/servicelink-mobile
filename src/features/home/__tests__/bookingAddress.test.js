import { formatBookingAddressForMaps, hasBookingAddressForMaps } from '../utils/bookingAddress';

describe('formatBookingAddressForMaps', () => {
  it('returns empty string for nullish booking', () => {
    expect(formatBookingAddressForMaps(null)).toBe('');
    expect(formatBookingAddressForMaps(undefined)).toBe('');
  });

  it('joins street, unit, city, state, zip with sensible commas', () => {
    expect(
      formatBookingAddressForMaps({
        customer_street_address: '  123 Main St  ',
        customer_unit_apt: '  Apt 4  ',
        customer_city: 'Austin',
        customer_state: 'TX',
        customer_zip: '78701',
      }),
    ).toBe('123 Main St Apt 4, Austin, TX 78701');
  });

  it('omits empty parts', () => {
    expect(
      formatBookingAddressForMaps({
        customer_street_address: '456 Oak',
        customer_unit_apt: '',
        customer_city: 'Portland',
        customer_state: '',
        customer_zip: '',
      }),
    ).toBe('456 Oak, Portland');
  });
});

describe('hasBookingAddressForMaps', () => {
  it('is false when formatted address is empty', () => {
    expect(hasBookingAddressForMaps({})).toBe(false);
  });

  it('is true when any address part produces a line', () => {
    expect(hasBookingAddressForMaps({ customer_city: 'Denver' })).toBe(true);
  });
});
