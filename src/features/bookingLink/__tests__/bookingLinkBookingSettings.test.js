import {
  dbModeToUiServiceType,
  languagesFromProfile,
  languagesToDb,
  serviceLocationFromProfile,
  serviceLocationToDb,
  uiServiceTypeToDbMode,
} from '../utils/bookingLinkBookingSettings';
import {
  BOOKING_DEFAULT_LANGUAGE_EN,
  BOOKING_DEFAULT_LANGUAGE_ES,
  BOOKING_SERVICE_TYPE_BOTH,
  BOOKING_SERVICE_TYPE_MOBILE,
  BOOKING_SERVICE_TYPE_SHOP,
} from '../edit/constants/bookingLinkBookingTab';

describe('bookingLinkBookingSettings', () => {
  it('maps UI service type to DB mode', () => {
    expect(uiServiceTypeToDbMode(BOOKING_SERVICE_TYPE_MOBILE)).toBe('mobile_only');
    expect(uiServiceTypeToDbMode(BOOKING_SERVICE_TYPE_SHOP)).toBe('shop_only');
    expect(uiServiceTypeToDbMode(BOOKING_SERVICE_TYPE_BOTH)).toBe('both');
  });

  it('maps DB mode to UI service type', () => {
    expect(dbModeToUiServiceType('shop_only')).toBe(BOOKING_SERVICE_TYPE_SHOP);
    expect(dbModeToUiServiceType(null)).toBe(BOOKING_SERVICE_TYPE_MOBILE);
  });

  it('reads service location from profile row', () => {
    expect(
      serviceLocationFromProfile({
        service_location_mode: 'both',
        service_area: 'Austin, TX',
        business_zip: '78701',
        shop_street_address: '123 Main St',
        shop_unit: 'Suite 4',
      }),
    ).toEqual({
      mode: BOOKING_SERVICE_TYPE_BOTH,
      shopStreetAddress: '123 Main St',
      shopUnit: 'Suite 4',
      city: 'Austin',
      state: 'TX',
      zip: '78701',
    });
  });

  it('clears shop fields when mobile only', () => {
    expect(serviceLocationToDb(BOOKING_SERVICE_TYPE_MOBILE, '123 Main', 'A')).toEqual({
      service_location_mode: 'mobile_only',
      shop_street_address: null,
      shop_unit: null,
    });
  });

  it('persists shop fields when shop mode', () => {
    expect(serviceLocationToDb(BOOKING_SERVICE_TYPE_SHOP, '123 Main', 'Suite 1')).toEqual({
      service_location_mode: 'shop_only',
      shop_street_address: '123 Main',
      shop_unit: 'Suite 1',
    });
  });

  it('reads languages from profile row', () => {
    expect(
      languagesFromProfile({
        public_booking_locales: ['en', 'es'],
        public_booking_default_locale: 'es',
      }),
    ).toEqual({
      offerSpanish: true,
      defaultLocale: BOOKING_DEFAULT_LANGUAGE_ES,
      locales: ['en', 'es'],
    });
  });

  it('forces English default when Spanish off', () => {
    expect(languagesToDb(false, BOOKING_DEFAULT_LANGUAGE_ES)).toEqual({
      public_booking_locales: ['en'],
      public_booking_default_locale: BOOKING_DEFAULT_LANGUAGE_EN,
    });
  });
});
