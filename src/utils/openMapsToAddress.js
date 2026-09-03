import { Alert, Linking, Platform } from 'react-native';

/**
 * Opens directions to an address in the device maps app: Apple Maps on iOS,
 * the `geo:` handler on Android, and the Google Maps web URL as the fallback
 * that works everywhere.
 *
 * @param {string | null | undefined} address
 * @param {{ noAddressMessage?: string }} [options]
 */
export async function openMapsToAddress(address, options = {}) {
  const line = typeof address === 'string' ? address.trim() : '';
  if (!line) {
    Alert.alert(
      'No address provided',
      options.noAddressMessage ?? 'Add an address to get directions.',
    );
    return;
  }

  const encoded = encodeURIComponent(line);
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
