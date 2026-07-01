import {
  bookingLinkEditBaselineFromProps,
  bookingLinkEditDraftFromFields,
  bookingLinkEditDirtyVsProps,
  bookingLinkEditIsDirty,
} from '../utils/bookingLinkTextSave';
import { BOOKING_SERVICE_TYPE_MOBILE } from '../edit/constants/bookingLinkBookingTab';

const defaultEditFields = {
  nameInput: '',
  typeInput: '',
  cityInput: '',
  stateInput: '',
  zipInput: '',
  bioInput: '',
  phoneInput: '',
  serviceTypeInput: BOOKING_SERVICE_TYPE_MOBILE,
  shopStreetInput: '',
  shopUnitInput: '',
  spanishEnabled: false,
  defaultLanguageInput: 'en',
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
      }),
    ).toBe(false);
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
