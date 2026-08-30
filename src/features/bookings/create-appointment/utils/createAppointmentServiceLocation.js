import {
  BOOKING_SERVICE_TYPE_BOTH,
  BOOKING_SERVICE_TYPE_MOBILE,
  BOOKING_SERVICE_TYPE_SHOP,
} from '../../../bookingLink/edit/constants/bookingLinkBookingTab';

export const CREATE_APPOINTMENT_LOCATION_MOBILE = BOOKING_SERVICE_TYPE_MOBILE;
export const CREATE_APPOINTMENT_LOCATION_SHOP = BOOKING_SERVICE_TYPE_SHOP;

export const CREATE_APPOINTMENT_LOCATION_OPTIONS = [
  {
    key: CREATE_APPOINTMENT_LOCATION_MOBILE,
    title: 'Mobile service',
    subtitle: 'You go to the customer.',
  },
  {
    key: CREATE_APPOINTMENT_LOCATION_SHOP,
    title: 'At your shop',
    subtitle: 'The customer comes to you.',
  },
];

/**
 * Owners with mobile-only or shop-only skip the picker; `both` shows Mobile vs Shop.
 * @param {string | null | undefined} businessServiceMode UI mode from {@link serviceLocationFromProfile}
 */
export function isCreateAppointmentLocationStepSkipped(businessServiceMode) {
  return businessServiceMode !== BOOKING_SERVICE_TYPE_BOTH;
}

/**
 * @param {string | null | undefined} businessServiceMode
 * @returns {'mobile' | 'shop' | null}
 */
export function getDefaultAppointmentLocationType(businessServiceMode) {
  if (businessServiceMode === BOOKING_SERVICE_TYPE_SHOP) {
    return CREATE_APPOINTMENT_LOCATION_SHOP;
  }
  if (businessServiceMode === BOOKING_SERVICE_TYPE_MOBILE) {
    return CREATE_APPOINTMENT_LOCATION_MOBILE;
  }
  return null;
}

/** @param {'mobile' | 'shop' | null | undefined} appointmentLocationType */
export function isLocationStepComplete(appointmentLocationType) {
  return (
    appointmentLocationType === CREATE_APPOINTMENT_LOCATION_MOBILE ||
    appointmentLocationType === CREATE_APPOINTMENT_LOCATION_SHOP
  );
}

/**
 * Shop mailing address only. Never fall back to the mobile serving city/state/ZIP.
 * @param {{
 *   shopStreetAddress?: string,
 *   shopUnit?: string,
 *   shopCity?: string,
 *   shopState?: string,
 *   shopZip?: string,
 * }} serviceLocation
 */
export function addressFormFromBusinessShopLocation(serviceLocation) {
  return {
    street: String(serviceLocation?.shopStreetAddress ?? '').trim(),
    unit: String(serviceLocation?.shopUnit ?? '').trim(),
    city: String(serviceLocation?.shopCity ?? '').trim(),
    state: String(serviceLocation?.shopState ?? '').trim(),
    zip: String(serviceLocation?.shopZip ?? '').trim(),
  };
}

/** @param {'mobile' | 'shop' | null | undefined} appointmentLocationType */
export function isCreateAppointmentAddressStepSkipped(appointmentLocationType) {
  return appointmentLocationType === CREATE_APPOINTMENT_LOCATION_SHOP;
}

/** @param {'mobile' | 'shop' | null | undefined} appointmentLocationType */
export function getCreateAppointmentAddressStepCopy(appointmentLocationType) {
  return {
    title: 'Service address',
    subtitle: 'Where will you perform this mobile service?',
  };
}

/** @param {'mobile' | 'shop' | null | undefined} appointmentLocationType */
export function getCreateAppointmentReviewAddressTitle(appointmentLocationType) {
  return appointmentLocationType === CREATE_APPOINTMENT_LOCATION_SHOP
    ? 'Shop address'
    : 'Service address';
}

/**
 * Maps wizard location to API / analytics field.
 * @param {'mobile' | 'shop' | null | undefined} appointmentLocationType
 */
export function appointmentLocationTypeForApi(appointmentLocationType) {
  return appointmentLocationType === CREATE_APPOINTMENT_LOCATION_SHOP ? 'shop' : 'mobile';
}
