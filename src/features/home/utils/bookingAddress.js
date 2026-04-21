/**
 * Build a single line suitable for maps / geocoding from granular `bookings` columns.
 * Format: `{street} {unit}, {city}, {state} {zip}` (omits empty parts).
 *
 * @param {object | null | undefined} booking
 * @returns {string}
 */
export function formatBookingAddressForMaps(booking) {
  if (!booking || typeof booking !== 'object') {
    return '';
  }

  const street = typeof booking.customer_street_address === 'string' ? booking.customer_street_address.trim() : '';
  const unit = typeof booking.customer_unit_apt === 'string' ? booking.customer_unit_apt.trim() : '';
  const city = typeof booking.customer_city === 'string' ? booking.customer_city.trim() : '';
  const state = typeof booking.customer_state === 'string' ? booking.customer_state.trim() : '';
  const zip = typeof booking.customer_zip === 'string' ? booking.customer_zip.trim() : '';

  const line1 = [street, unit].filter(Boolean).join(' ');
  const stateZip = [state, zip].filter(Boolean).join(' ').trim();
  const line2Parts = [];
  if (city) {
    line2Parts.push(city);
  }
  if (stateZip) {
    line2Parts.push(stateZip);
  }
  const line2 = line2Parts.join(', ');

  return [line1, line2].filter(Boolean).join(', ');
}

/**
 * @param {object | null | undefined} booking
 */
export function hasBookingAddressForMaps(booking) {
  return formatBookingAddressForMaps(booking).trim().length > 0;
}
