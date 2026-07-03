import {
  CREATE_APPOINTMENT_LOCATION_MOBILE,
  CREATE_APPOINTMENT_LOCATION_SHOP,
  addressFormFromBusinessShopLocation,
  appointmentLocationTypeForApi,
  getDefaultAppointmentLocationType,
  isCreateAppointmentAddressStepSkipped,
  isCreateAppointmentLocationStepSkipped,
  isLocationStepComplete,
} from '../utils/createAppointmentServiceLocation';
import { BOOKING_SERVICE_TYPE_BOTH } from '../../../bookingLink/edit/constants/bookingLinkBookingTab';

describe('createAppointmentServiceLocation', () => {
  it('skips location step unless business offers both', () => {
    expect(isCreateAppointmentLocationStepSkipped('mobile')).toBe(true);
    expect(isCreateAppointmentLocationStepSkipped('shop')).toBe(true);
    expect(isCreateAppointmentLocationStepSkipped(BOOKING_SERVICE_TYPE_BOTH)).toBe(false);
  });

  it('defaults location type from business mode', () => {
    expect(getDefaultAppointmentLocationType('mobile')).toBe(CREATE_APPOINTMENT_LOCATION_MOBILE);
    expect(getDefaultAppointmentLocationType('shop')).toBe(CREATE_APPOINTMENT_LOCATION_SHOP);
    expect(getDefaultAppointmentLocationType(BOOKING_SERVICE_TYPE_BOTH)).toBeNull();
  });

  it('maps shop profile fields to address form', () => {
    expect(
      addressFormFromBusinessShopLocation({
        shopStreetAddress: '123 Main',
        shopUnit: 'Suite 1',
        city: 'Austin',
        state: 'TX',
        zip: '78701',
      }),
    ).toEqual({
      street: '123 Main',
      unit: 'Suite 1',
      city: 'Austin',
      state: 'TX',
      zip: '78701',
    });
  });

  it('validates location step selection', () => {
    expect(isLocationStepComplete(CREATE_APPOINTMENT_LOCATION_MOBILE)).toBe(true);
    expect(isLocationStepComplete(null)).toBe(false);
  });

  it('skips address step for shop appointments', () => {
    expect(isCreateAppointmentAddressStepSkipped(CREATE_APPOINTMENT_LOCATION_SHOP)).toBe(true);
    expect(isCreateAppointmentAddressStepSkipped(CREATE_APPOINTMENT_LOCATION_MOBILE)).toBe(false);
  });

  it('maps API location type', () => {
    expect(appointmentLocationTypeForApi(CREATE_APPOINTMENT_LOCATION_SHOP)).toBe('shop');
    expect(appointmentLocationTypeForApi(CREATE_APPOINTMENT_LOCATION_MOBILE)).toBe('mobile');
  });
});
