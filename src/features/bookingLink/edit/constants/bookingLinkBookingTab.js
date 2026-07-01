export const BOOKING_SERVICE_TYPE_MOBILE = 'mobile';
export const BOOKING_SERVICE_TYPE_SHOP = 'shop';
export const BOOKING_SERVICE_TYPE_BOTH = 'both';

export const BOOKING_SERVICE_TYPE_OPTIONS = [
  { key: BOOKING_SERVICE_TYPE_MOBILE, label: 'Mobile' },
  { key: BOOKING_SERVICE_TYPE_SHOP, label: 'Shop' },
  { key: BOOKING_SERVICE_TYPE_BOTH, label: 'Both' },
];

export const BOOKING_DEFAULT_LANGUAGE_EN = 'en';
export const BOOKING_DEFAULT_LANGUAGE_ES = 'es';

export const BOOKING_DEFAULT_LANGUAGE_OPTIONS = [
  { key: BOOKING_DEFAULT_LANGUAGE_EN, label: 'English' },
  { key: BOOKING_DEFAULT_LANGUAGE_ES, label: 'Spanish' },
];

export function getBookingServiceTypeDescription(serviceType) {
  switch (serviceType) {
    case BOOKING_SERVICE_TYPE_SHOP:
      return 'Customers visit your shop. Add your business address below.';
    case BOOKING_SERVICE_TYPE_BOTH:
      return 'You offer mobile service and in-shop visits. Add your shop address below.';
    case BOOKING_SERVICE_TYPE_MOBILE:
    default:
      return 'You go to them. Customers enter their address when booking.';
  }
}

export function bookingServiceTypeShowsShopAddress(serviceType) {
  return serviceType === BOOKING_SERVICE_TYPE_SHOP || serviceType === BOOKING_SERVICE_TYPE_BOTH;
}

export function bookingServiceTypeShowsServiceArea(serviceType) {
  return serviceType === BOOKING_SERVICE_TYPE_MOBILE || serviceType === BOOKING_SERVICE_TYPE_BOTH;
}
