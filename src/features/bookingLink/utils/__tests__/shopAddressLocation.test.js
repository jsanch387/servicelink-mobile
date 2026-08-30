import { buildSavedShopLocation, formatShopAddressLabel } from '../shopAddressLocation';

describe('formatShopAddressLabel', () => {
  it('joins street with city, state, and ZIP', () => {
    expect(formatShopAddressLabel('123 Main St', 'Austin', 'TX', '78701')).toBe(
      '123 Main St, Austin, TX 78701',
    );
  });

  it('returns the street alone when city or state is missing', () => {
    expect(formatShopAddressLabel('123 Main St', '', 'TX', '78701')).toBe('123 Main St');
  });

  it('returns empty when there is no street', () => {
    expect(formatShopAddressLabel('', 'Austin', 'TX', '78701')).toBe('');
  });
});

describe('buildSavedShopLocation', () => {
  it('builds a selected place from saved shop fields', () => {
    expect(
      buildSavedShopLocation({
        street: '123 Main St',
        city: 'Austin',
        state: 'tx',
        zip: '78701',
      }),
    ).toMatchObject({
      providerId: 'saved-shop',
      street: '123 Main St',
      city: 'Austin',
      state: 'TX',
      zip: '78701',
      label: '123 Main St, Austin, TX 78701',
      placeType: 'address',
    });
  });

  it('returns null without a street', () => {
    expect(buildSavedShopLocation({ street: '', city: 'Austin', state: 'TX' })).toBeNull();
  });
});
