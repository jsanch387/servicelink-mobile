export function createAppointmentAvailabilityQueryKey(businessId) {
  return ['createAppointment', 'availability', businessId];
}

export function createAppointmentPriceOptionsQueryKey(businessId, serviceId) {
  return ['createAppointment', 'priceOptions', businessId, serviceId];
}

export function createAppointmentBlockingBookingsQueryKey(businessId, fromYyyyMmDd, toYyyyMmDd) {
  return ['createAppointment', 'blockingBookings', businessId, fromYyyyMmDd, toYyyyMmDd];
}
