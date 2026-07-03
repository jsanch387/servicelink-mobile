import { Linking } from 'react-native';
import { getNativeStoreUpdateUrl } from './getNativeStoreUpdateConfig';

export async function openNativeStoreUpdate() {
  const url = getNativeStoreUpdateUrl();
  if (!url) {
    return false;
  }

  await Linking.openURL(url);
  return true;
}
