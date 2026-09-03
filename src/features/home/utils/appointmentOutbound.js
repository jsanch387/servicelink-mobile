import { openMapsToAddress as openMapsForAddress } from '../../../utils/openMapsToAddress';
import { openNativeSms } from '../../../utils/openNativeSms';
import { phoneForSmsUri } from '../../../utils/phone';
import { formatBookingAddressForMaps } from './bookingAddress';

/**
 * Prefilled SMS when the owner taps **On my way** on the Next Up card.
 * Intentionally omits customer name so a wrong name on file is never sent.
 *
 * @param {object} _booking Reserved for API parity with {@link openSmsOnMyWay}.
 * @param {{ businessName?: string | null }} [options]
 */
export function buildOnMyWaySmsBody(_booking, options = {}) {
  const businessName = options.businessName?.trim() || '';

  if (businessName) {
    return `Hey, this is ${businessName}. I'm heading your way for your appointment. See you soon!`;
  }

  return `Hey, I'm heading your way for your appointment. See you soon!`;
}

export function buildServiceStartingSmsBody(booking) {
  const name = booking.customer_name?.trim() || 'there';
  return `Hi ${name}, I'm starting your ServiceLink appointment now.`;
}

/**
 * @param {{ customer_name?: string | null; customer_phone?: string | null }} booking
 * @param {string} body
 */
async function openSmsToCustomer(booking, body) {
  const addr = phoneForSmsUri(booking.customer_phone);

  await openNativeSms({
    address: addr,
    body,
    unsupportedMessage: addr
      ? 'Open your SMS app manually to contact the customer.'
      : 'Open your SMS app manually. Add a customer phone on this booking to prefill their number next time.',
  });
}

/**
 * @param {{ customer_name?: string | null; customer_phone?: string | null }} booking
 * @param {{ businessName?: string | null }} [options]
 */
export async function openSmsOnMyWay(booking, options = {}) {
  await openSmsToCustomer(booking, buildOnMyWaySmsBody(booking, options));
}

/**
 * Opens Messages with a “service is starting” text (Home in-progress spotlight).
 *
 * @param {{ customer_name?: string | null; customer_phone?: string | null }} booking
 */
export async function openSmsServiceStarting(booking) {
  await openSmsToCustomer(booking, buildServiceStartingSmsBody(booking));
}

/**
 * @param {string | null | undefined} address
 */
export async function openMapsToAddress(address) {
  await openMapsForAddress(address, {
    noAddressMessage: 'Add an address on this booking to get directions.',
  });
}

/**
 * Uses granular `customer_street_address`, unit, city, state, zip — see `bookingAddress.js`.
 * @param {object | null | undefined} booking
 */
export async function openMapsForBooking(booking) {
  const line = formatBookingAddressForMaps(booking);
  await openMapsToAddress(line);
}
