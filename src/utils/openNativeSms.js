import { Alert, Linking, Platform } from 'react-native';

/**
 * Platform-correct SMS deep link (iOS: `sms:` + `&body=`; Android: `smsto:` + `?body=`).
 *
 * @param {{ address?: string | null; body?: string | null; useLegacySmsScheme?: boolean }} params
 * @returns {string}
 */
export function buildSmsDeepLink({ address, body, useLegacySmsScheme = false }) {
  const addr = typeof address === 'string' ? address.trim() : '';
  const text = typeof body === 'string' ? body : '';
  const encodedBody = text ? encodeURIComponent(text) : '';

  if (Platform.OS === 'android' && !useLegacySmsScheme) {
    if (addr) {
      return encodedBody ? `smsto:${addr}?body=${encodedBody}` : `smsto:${addr}`;
    }
    return encodedBody ? `sms:?body=${encodedBody}` : 'sms:';
  }

  if (Platform.OS === 'android' && useLegacySmsScheme) {
    if (addr) {
      return encodedBody ? `sms:${addr}?body=${encodedBody}` : `sms:${addr}`;
    }
    return encodedBody ? `sms:?body=${encodedBody}` : 'sms:';
  }

  if (addr) {
    return encodedBody ? `sms:${addr}&body=${encodedBody}` : `sms:${addr}`;
  }
  return encodedBody ? `sms:&body=${encodedBody}` : 'sms:';
}

/**
 * Opens the device SMS composer. On Android, skips `canOpenURL` (package visibility) and uses `smsto:`.
 *
 * @param {{
 *   address?: string | null;
 *   body?: string | null;
 *   noAddressMessage?: string;
 *   unsupportedMessage?: string;
 * }} params
 */
export async function openNativeSms({ address, body, noAddressMessage, unsupportedMessage }) {
  const addr = typeof address === 'string' ? address.trim() : '';
  if (!addr && noAddressMessage) {
    Alert.alert('No phone number', noAddressMessage);
    return;
  }

  const urls = [buildSmsDeepLink({ address: addr, body })];
  if (Platform.OS === 'android' && addr) {
    urls.push(buildSmsDeepLink({ address: addr, body, useLegacySmsScheme: true }));
  }

  for (const url of urls) {
    try {
      if (Platform.OS === 'ios') {
        const supported = await Linking.canOpenURL(url);
        if (!supported) {
          continue;
        }
      }
      await Linking.openURL(url);
      return;
    } catch {
      // try next URL shape
    }
  }

  Alert.alert(
    'Unable to open Messages',
    unsupportedMessage ?? 'Open your SMS app manually to contact the customer.',
  );
}
