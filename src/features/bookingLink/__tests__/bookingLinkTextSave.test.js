import {
  bookingLinkEditBaselineFromProps,
  bookingLinkEditDraftFromFields,
  bookingLinkEditDirtyVsProps,
  bookingLinkEditIsDirty,
} from '../utils/bookingLinkTextSave';
import {
  BOOKING_SERVICE_TYPE_BOTH,
  BOOKING_SERVICE_TYPE_MOBILE,
} from '../edit/constants/bookingLinkBookingTab';

const defaultEditFields = {
  nameInput: '',
  typeInput: '',
  specialtiesInput: [],
  cityInput: '',
  stateInput: '',
  zipInput: '',
  bioInput: '',
  phoneInput: '',
  instagramInput: '',
  tiktokInput: '',
  serviceTypeInput: BOOKING_SERVICE_TYPE_MOBILE,
  shopStreetInput: '',
  shopUnitInput: '',
  shopCityInput: '',
  shopStateInput: '',
  shopZipInput: '',
  spanishEnabled: false,
  defaultLanguageInput: 'en',
  policyEnabled: false,
  policyInput: '',
};

describe('bookingLinkTextSave', () => {
  it('marks dirty when name changes', () => {
    const base = {
      businessName: 'A',
      businessType: 'T',
      businessCity: '',
      businessState: '',
      businessZip: '',
      businessBio: '',
      phoneNumber: '',
      socialMedia: {},
      serviceLocationMode: 'mobile_only',
      shopStreetAddress: '',
      shopUnit: '',
      publicBookingLocales: ['en'],
      publicBookingDefaultLocale: 'en',
    };
    expect(
      bookingLinkEditDirtyVsProps(base, {
        ...defaultEditFields,
        nameInput: 'B',
        typeInput: 'T',
      }),
    ).toBe(true);
  });

  it('not dirty when form matches baseline (phone formatted same digits)', () => {
    const baseProps = {
      businessName: 'Shop',
      businessType: 'Detailing',
      businessCity: 'Austin',
      businessState: 'tx',
      businessZip: '78701',
      businessBio: '',
      phoneNumber: '+15552345678',
      socialMedia: { instagram: 'shop', tiktok: '' },
      serviceLocationMode: 'mobile_only',
      shopStreetAddress: '',
      shopUnit: '',
      publicBookingLocales: ['en'],
      publicBookingDefaultLocale: 'en',
    };
    expect(
      bookingLinkEditDirtyVsProps(baseProps, {
        ...defaultEditFields,
        nameInput: 'Shop',
        typeInput: 'Detailing',
        cityInput: 'Austin',
        stateInput: 'TX',
        zipInput: '78701',
        phoneInput: '(555) 234-5678',
        instagramInput: 'shop',
        tiktokInput: '',
      }),
    ).toBe(false);
  });

  it('marks dirty when social handle changes', () => {
    const baseProps = {
      businessName: 'Shop',
      businessType: 'Detailing',
      businessCity: '',
      businessState: '',
      businessZip: '',
      businessBio: '',
      phoneNumber: '',
      socialMedia: { instagram: 'old', tiktok: '' },
      serviceLocationMode: 'mobile_only',
      shopStreetAddress: '',
      shopUnit: '',
      publicBookingLocales: ['en'],
      publicBookingDefaultLocale: 'en',
    };
    expect(
      bookingLinkEditDirtyVsProps(baseProps, {
        ...defaultEditFields,
        nameInput: 'Shop',
        typeInput: 'Detailing',
        instagramInput: 'new',
      }),
    ).toBe(true);
  });

  it('marks dirty when customer policy changes', () => {
    const baseProps = {
      businessName: 'Shop',
      businessType: 'Detailing',
      businessCity: '',
      businessState: '',
      businessZip: '',
      businessBio: '',
      phoneNumber: '',
      socialMedia: {},
      serviceLocationMode: 'mobile_only',
      shopStreetAddress: '',
      shopUnit: '',
      publicBookingLocales: ['en'],
      publicBookingDefaultLocale: 'en',
      bookingPolicyEnabled: false,
      bookingPolicyText: '',
    };
    expect(
      bookingLinkEditDirtyVsProps(baseProps, {
        ...defaultEditFields,
        nameInput: 'Shop',
        typeInput: 'Detailing',
        policyEnabled: true,
        policyInput: 'Deposits are non-refundable.',
      }),
    ).toBe(true);
  });

  it('marks dirty when shop city changes without touching mobile city', () => {
    const baseProps = {
      businessName: 'Shop',
      businessType: 'Detailing',
      businessCity: 'Austin',
      businessState: 'TX',
      businessZip: '78701',
      businessBio: '',
      phoneNumber: '',
      socialMedia: {},
      serviceLocationMode: 'both',
      shopStreetAddress: '410 E Pecan St',
      shopUnit: '',
      shopCity: 'Austin',
      shopState: 'TX',
      shopZip: '78701',
      publicBookingLocales: ['en'],
      publicBookingDefaultLocale: 'en',
    };
    expect(
      bookingLinkEditDirtyVsProps(baseProps, {
        ...defaultEditFields,
        nameInput: 'Shop',
        typeInput: 'Detailing',
        cityInput: 'Austin',
        stateInput: 'TX',
        zipInput: '78701',
        serviceTypeInput: BOOKING_SERVICE_TYPE_BOTH,
        shopStreetInput: '410 E Pecan St',
        shopCityInput: 'Pflugerville',
        shopStateInput: 'TX',
        shopZipInput: '78660',
      }),
    ).toBe(true);
  });

  it('snapshots equal after normalize state', () => {
    const b = bookingLinkEditBaselineFromProps({
      businessState: 'ca',
      businessBio: undefined,
      serviceLocationMode: 'mobile_only',
      publicBookingLocales: ['en'],
    });
    const d = bookingLinkEditDraftFromFields({ ...defaultEditFields, stateInput: 'CA' });
    expect(bookingLinkEditIsDirty(b, d)).toBe(false);
  });
});
