import { openNativeSms } from '../../../../utils/openNativeSms';
import { phoneForSmsUri } from '../../../../utils/phone';

/**
 * Opens the native SMS app with the recipient prefilled.
 * @param {{ phone: string }} params
 */
export async function openCustomerCheckInSms({ phone }) {
  const addr = phoneForSmsUri(phone);
  await openNativeSms({
    address: addr,
    noAddressMessage: 'Add a phone number for this customer to send a text.',
    unsupportedMessage: 'Open your SMS app manually to contact this customer.',
  });
}
