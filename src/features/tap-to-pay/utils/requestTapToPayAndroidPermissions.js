import { Alert, PermissionsAndroid, Platform } from 'react-native';

/**
 * Tap to Pay on Android requires fine location permission for Terminal reader discovery.
 *
 * @returns {Promise<boolean>}
 */
export async function requestTapToPayAndroidPermissions() {
  if (Platform.OS !== 'android') {
    return true;
  }

  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Location permission',
        message: 'ServiceLink needs location access to accept Tap to Pay payments.',
        buttonPositive: 'Allow',
      },
    );
    if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
      Alert.alert(
        'Location required',
        'Location access is required to accept Tap to Pay payments on this device.',
      );
      return false;
    }
    return true;
  } catch {
    Alert.alert(
      'Location required',
      'Location access is required to accept Tap to Pay payments on this device.',
    );
    return false;
  }
}
