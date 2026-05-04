import { Alert, Linking, Platform } from 'react-native';
import { phoneForSmsUri } from '../../../utils/phone';
import { formatBookingAddressForMaps } from './bookingAddress';

/**
 * @param {{ customer_name?: string | null }} booking
 */
export function buildOnMyWaySmsBody(booking) {
  const name = booking.customer_name?.trim() || 'there';
  return `Hi ${name}, I'm on my way for your ServiceLink appointment. See you soon!`;
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
  if (!addr) {
    Alert.alert('Missing phone number', 'Add a customer phone on this booking to send a text.');
    return;
  }
  const join = Platform.OS === 'ios' ? '&' : '?';
  const url = `sms:${addr}${join}body=${encodeURIComponent(body)}`;

  try {
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert('Unable to open Messages', 'Open your SMS app manually to contact the customer.');
      return;
    }
    await Linking.openURL(url);
  } catch {
    Alert.alert('Unable to open Messages', 'Something went wrong opening the messaging app.');
  }
}

/**
 * @param {{ customer_name?: string | null; customer_phone?: string | null }} booking
 */
export async function openSmsOnMyWay(booking) {
  await openSmsToCustomer(booking, buildOnMyWaySmsBody(booking));
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
 * Opens directions in Maps (Apple Maps on iOS when available, else Google URL works everywhere).
 * @param {string | null | undefined} address
 */
export async function openMapsToAddress(address) {
  const a = typeof address === 'string' ? address.trim() : '';
  if (!a) {
    Alert.alert('Missing address', 'Add an address on this booking to open maps.');
    return;
  }

  const encoded = encodeURIComponent(a);
  const apple = `maps://?daddr=${encoded}`;
  const google = `https://www.google.com/maps/dir/?api=1&destination=${encoded}`;

  try {
    if (Platform.OS === 'ios') {
      const ok = await Linking.canOpenURL(apple);
      if (ok) {
        await Linking.openURL(apple);
        return;
      }
    } else {
      const geo = `geo:0,0?q=${encoded}`;
      const okGeo = await Linking.canOpenURL(geo);
      if (okGeo) {
        await Linking.openURL(geo);
        return;
      }
    }
    await Linking.openURL(google);
  } catch {
    Alert.alert('Unable to open Maps', 'Try opening maps and searching for the address.');
  }
}

/**
 * Uses granular `customer_street_address`, unit, city, state, zip — see `bookingAddress.js`.
 * @param {object | null | undefined} booking
 */
export async function openMapsForBooking(booking) {
  const line = formatBookingAddressForMaps(booking);
  await openMapsToAddress(line);
}
