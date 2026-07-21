import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { BOOKING_LINK_QR } from '../constants/bookingLinkQr';

/**
 * @param {import('react').RefObject<unknown>} viewRef
 * @returns {Promise<string>} local file URI
 */
export async function captureBookingLinkQr(viewRef) {
  if (!viewRef?.current) {
    throw new Error('QR code is not ready yet.');
  }

  const uri = await captureRef(viewRef, {
    format: 'png',
    quality: 1,
    result: 'tmpfile',
    width: BOOKING_LINK_QR.captureSize,
    height: BOOKING_LINK_QR.captureSize,
  });

  if (!uri) {
    throw new Error('Could not create the image.');
  }

  return uri;
}

/**
 * @param {string} uri
 */
export async function shareBookingLinkQr(uri) {
  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error('Sharing is not available on this device.');
  }
  await Sharing.shareAsync(uri, {
    mimeType: 'image/png',
    UTI: 'public.png',
    dialogTitle: 'Share QR code',
  });
}

/**
 * @param {string} uri
 * @returns {Promise<string>} asset id
 */
export async function saveBookingLinkQrToLibrary(uri) {
  const permission = await MediaLibrary.requestPermissionsAsync(true);
  if (!permission.granted) {
    throw new Error('Photo library access is needed to save the QR code.');
  }
  return (await MediaLibrary.createAssetAsync(uri)).id;
}
