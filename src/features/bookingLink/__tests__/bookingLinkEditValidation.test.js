import { validateBookingLinkEditFields } from '../utils/bookingLinkEditValidation';
import {
  BOOKING_SERVICE_TYPE_MOBILE,
  BOOKING_SERVICE_TYPE_SHOP,
} from '../edit/constants/bookingLinkBookingTab';

describe('validateBookingLinkEditFields', () => {
  it('allows a legacy city and state without a MapTiler pick', () => {
    expect(
      validateBookingLinkEditFields({
        cityInput: 'Austin',
        stateInput: 'TX',
        zipInput: '78701',
        serviceTypeInput: BOOKING_SERVICE_TYPE_MOBILE,
      }),
    ).toEqual({ ok: true });
  });

  it('requires a suggestion only when the search field changed without a pick', () => {
    expect(
      validateBookingLinkEditFields({
        cityInput: 'Austin',
        stateInput: 'TX',
        zipInput: '78701',
        serviceTypeInput: BOOKING_SERVICE_TYPE_MOBILE,
        locationRequiresSuggestion: true,
      }),
    ).toEqual({
      ok: false,
      title: 'Location',
      message: 'Choose a suggested location to confirm it',
    });
  });

  it('requires city and state', () => {
    expect(
      validateBookingLinkEditFields({
        cityInput: '',
        stateInput: 'TX',
        zipInput: '78701',
        serviceTypeInput: BOOKING_SERVICE_TYPE_MOBILE,
        hasConfirmedLocation: true,
      }),
    ).toEqual({ ok: false, title: 'Location', message: 'City and state are required.' });
  });

  it('allows mobile without ZIP', () => {
    expect(
      validateBookingLinkEditFields({
        cityInput: 'Austin',
        stateInput: 'TX',
        zipInput: '',
        serviceTypeInput: BOOKING_SERVICE_TYPE_MOBILE,
        hasConfirmedLocation: true,
      }),
    ).toEqual({ ok: true });
  });

  it('requires shop street plus shop city and state for shop mode', () => {
    expect(
      validateBookingLinkEditFields({
        cityInput: 'Austin',
        stateInput: 'TX',
        zipInput: '78701',
        serviceTypeInput: BOOKING_SERVICE_TYPE_SHOP,
        shopStreetInput: '',
        hasConfirmedLocation: true,
      }),
    ).toEqual({
      ok: false,
      title: 'Shop address',
      message: 'Shop street address is required.',
    });

    expect(
      validateBookingLinkEditFields({
        cityInput: 'Austin',
        stateInput: 'TX',
        zipInput: '',
        serviceTypeInput: BOOKING_SERVICE_TYPE_SHOP,
        shopStreetInput: '123 Main St',
        hasConfirmedLocation: true,
      }),
    ).toEqual({
      ok: false,
      title: 'Shop address',
      message: 'Pick a street address so we can save the shop city and state.',
    });

    expect(
      validateBookingLinkEditFields({
        cityInput: 'Austin',
        stateInput: 'TX',
        zipInput: '',
        serviceTypeInput: BOOKING_SERVICE_TYPE_SHOP,
        shopStreetInput: '410 E Pecan St',
        shopCityInput: 'Pflugerville',
        shopStateInput: 'TX',
        shopZipInput: '78660',
        hasConfirmedLocation: true,
      }),
    ).toEqual({ ok: true });
  });

  it('requires a suggested shop address when the search changed without a pick', () => {
    expect(
      validateBookingLinkEditFields({
        cityInput: 'Austin',
        stateInput: 'TX',
        zipInput: '78701',
        serviceTypeInput: BOOKING_SERVICE_TYPE_SHOP,
        shopStreetInput: '123 Main St',
        shopRequiresSuggestion: true,
      }),
    ).toEqual({
      ok: false,
      title: 'Shop address',
      message: 'Choose a suggested shop address.',
    });
  });

  it('requires policy text when agreement is required', () => {
    expect(
      validateBookingLinkEditFields({
        cityInput: 'Austin',
        stateInput: 'TX',
        zipInput: '78701',
        serviceTypeInput: BOOKING_SERVICE_TYPE_MOBILE,
        hasConfirmedLocation: true,
        policyEnabled: true,
        policyInput: '   ',
      }),
    ).toEqual({
      ok: false,
      title: 'Customer policy',
      message: 'Add your customer policy or turn it off.',
    });
  });

  it('requires at least one niche', () => {
    expect(
      validateBookingLinkEditFields({
        cityInput: 'Austin',
        stateInput: 'TX',
        zipInput: '78701',
        serviceTypeInput: BOOKING_SERVICE_TYPE_MOBILE,
        typeInput: 'Vehicle Services',
        specialtiesInput: [],
      }),
    ).toEqual({
      ok: false,
      title: 'Business type',
      message: 'Pick at least one thing people hire you for',
    });
  });

  it('passes for valid mobile profile', () => {
    expect(
      validateBookingLinkEditFields({
        cityInput: 'Austin',
        stateInput: 'TX',
        zipInput: '78701',
        serviceTypeInput: BOOKING_SERVICE_TYPE_MOBILE,
        typeInput: 'Vehicle Services',
        specialtiesInput: ['detailing'],
      }),
    ).toEqual({ ok: true });
  });
});
