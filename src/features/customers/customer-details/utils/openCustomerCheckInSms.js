import { Alert, Linking } from 'react-native';
import { phoneForSmsUri } from '../../../../utils/phone';

/**
 * Opens the native SMS app with the recipient prefilled.
 * @param {{ phone: string }} params
 */
export async function openCustomerCheckInSms({ phone }) {
  const addr = phoneForSmsUri(phone);
  if (!addr) {
    Alert.alert('No phone number', 'Add a phone number for this customer to send a text.');
    return;
  }
  const url = `sms:${addr}`;

  try {
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert(
        'Unable to open Messages',
        'Open your SMS app manually to contact this customer.',
      );
      return;
    }
    await Linking.openURL(url);
  } catch {
    Alert.alert('Unable to open Messages', 'Something went wrong opening the messaging app.');
  }
}
