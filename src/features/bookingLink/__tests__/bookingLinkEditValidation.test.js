import { validateBookingLinkEditFields } from '../utils/bookingLinkEditValidation';
import {
  BOOKING_SERVICE_TYPE_MOBILE,
  BOOKING_SERVICE_TYPE_SHOP,
} from '../edit/constants/bookingLinkBookingTab';

describe('validateBookingLinkEditFields', () => {
  it('requires city, state, and zip', () => {
    expect(
      validateBookingLinkEditFields({
        cityInput: '',
        stateInput: 'TX',
        zipInput: '78701',
        serviceTypeInput: BOOKING_SERVICE_TYPE_MOBILE,
      }),
    ).toEqual({ ok: false, title: 'Location', message: 'City and state are required.' });

    expect(
      validateBookingLinkEditFields({
        cityInput: 'Austin',
        stateInput: 'TX',
        zipInput: '',
        serviceTypeInput: BOOKING_SERVICE_TYPE_MOBILE,
      }),
    ).toEqual({ ok: false, title: 'Location', message: 'ZIP is required.' });
  });

  it('requires shop street for shop mode', () => {
    expect(
      validateBookingLinkEditFields({
        cityInput: 'Austin',
        stateInput: 'TX',
        zipInput: '78701',
        serviceTypeInput: BOOKING_SERVICE_TYPE_SHOP,
        shopStreetInput: '',
      }),
    ).toEqual({
      ok: false,
      title: 'Shop address',
      message: 'Shop street address is required.',
    });
  });

  it('passes for valid mobile profile', () => {
    expect(
      validateBookingLinkEditFields({
        cityInput: 'Austin',
        stateInput: 'TX',
        zipInput: '78701',
        serviceTypeInput: BOOKING_SERVICE_TYPE_MOBILE,
      }),
    ).toEqual({ ok: true });
  });
});
