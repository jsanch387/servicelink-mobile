import { needsLegacyShopAddressUpdate } from '../utils/needsLegacyShopAddressUpdate';

describe('needsLegacyShopAddressUpdate', () => {
  it('is false for mobile-only', () => {
    expect(
      needsLegacyShopAddressUpdate({
        service_location_mode: 'mobile_only',
        shop_city: '',
        shop_state: '',
      }),
    ).toBe(false);
  });

  it('is true for shop or both without shop city and state', () => {
    expect(
      needsLegacyShopAddressUpdate({
        service_location_mode: 'shop_only',
        shop_city: '',
        shop_state: '',
      }),
    ).toBe(true);

    expect(
      needsLegacyShopAddressUpdate({
        service_location_mode: 'both',
        shop_city: 'Pflugerville',
        shop_state: '',
      }),
    ).toBe(true);
  });

  it('is false when shop has its own city and state', () => {
    expect(
      needsLegacyShopAddressUpdate({
        service_location_mode: 'both',
        shop_city: 'Pflugerville',
        shop_state: 'TX',
      }),
    ).toBe(false);
  });
});
