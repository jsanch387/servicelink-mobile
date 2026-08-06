import { parseBookingStartLocalMs } from '../../../home/utils/bookingStart';

/**
 * @param {{ street?: string; unit?: string; city?: string; state?: string; zip?: string } | null | undefined} a
 * @param {{ street?: string; unit?: string; city?: string; state?: string; zip?: string } | null | undefined} b
 */
function addressesMatch(a, b) {
  if (!a || !b) return false;
  const norm = (value) =>
    String(value ?? '')
      .trim()
      .toLowerCase();
  return (
    norm(a.street) === norm(b.street) &&
    norm(a.unit) === norm(b.unit) &&
    norm(a.city) === norm(b.city) &&
    norm(a.state) === norm(b.state) &&
    norm(a.zip) === norm(b.zip)
  );
}

/**
 * @param {Record<string, unknown> | null | undefined} booking
 * @returns {{ street: string; unit: string; city: string; state: string; zip: string } | null}
 */
function addressFormFromBooking(booking) {
  if (!booking || typeof booking !== 'object') {
    return null;
  }
  const street = String(booking.customer_street_address ?? '').trim();
  const unit = String(booking.customer_unit_apt ?? '').trim();
  const city = String(booking.customer_city ?? '').trim();
  const state = String(booking.customer_state ?? '')
    .trim()
    .toUpperCase();
  const zip = String(booking.customer_zip ?? '').trim();

  // Need at least a street — otherwise it's not useful as a rebook seed.
  if (!street) {
    return null;
  }

  return { street, unit, city, state, zip };
}

/**
 * True when this booking's stored address is a customer/mobile service location — not the shop.
 *
 * Shop visits often write the business shop address into `customer_street_*`. Rebook must not
 * treat that as the customer's home/service address.
 *
 * @param {Record<string, unknown>} booking
 * @param {{ street: string; unit: string; city: string; state: string; zip: string } | null | undefined} [shopAddress]
 */
function isCustomerServiceAddress(booking, shopAddress) {
  const locationType = String(booking?.service_location_type ?? '')
    .trim()
    .toLowerCase();
  if (locationType === 'shop') {
    return false;
  }

  const address = addressFormFromBooking(booking);
  if (!address) {
    return false;
  }

  // Legacy rows without service_location_type: skip when the address matches the shop.
  if (
    shopAddress &&
    String(shopAddress.street ?? '').trim() &&
    addressesMatch(address, shopAddress)
  ) {
    return false;
  }

  return true;
}

/**
 * Most recent *customer/mobile* booking address (by `scheduled_date` + `start_time`).
 * Address lives on bookings, not the CRM `customers` row — this is the rebook seed.
 * Shop bookings (and addresses that match the shop) are excluded.
 *
 * @param {Array<Record<string, unknown>> | null | undefined} bookings
 * @param {{
 *   shopAddress?: { street: string; unit: string; city: string; state: string; zip: string } | null;
 * }} [options]
 * @returns {{ street: string; unit: string; city: string; state: string; zip: string } | null}
 */
export function pickLastKnownCustomerAddress(bookings, options = {}) {
  const shopAddress = options.shopAddress ?? null;
  let best = null;
  let bestMs = -Infinity;

  for (const booking of bookings ?? []) {
    if (!isCustomerServiceAddress(booking, shopAddress)) {
      continue;
    }
    const address = addressFormFromBooking(booking);
    if (!address) {
      continue;
    }
    const startMs = parseBookingStartLocalMs(booking?.scheduled_date, booking?.start_time);
    const ms = Number.isFinite(startMs) ? startMs : 0;
    if (ms >= bestMs) {
      bestMs = ms;
      best = address;
    }
  }

  return best;
}
