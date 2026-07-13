import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';

/** Instagram Stories native canvas size. */
export const MARKETING_STORY_CAPTURE_WIDTH = 1080;
export const MARKETING_STORY_CAPTURE_HEIGHT = 1920;

/**
 * @param {import('react').RefObject<unknown>} viewRef
 * @returns {Promise<string>} local file URI
 */
export async function captureMarketingShareStory(viewRef) {
  if (!viewRef?.current) {
    throw new Error('Story preview is not ready yet.');
  }

  const uri = await captureRef(viewRef, {
    format: 'png',
    quality: 1,
    result: 'tmpfile',
    width: MARKETING_STORY_CAPTURE_WIDTH,
    height: MARKETING_STORY_CAPTURE_HEIGHT,
  });

  if (!uri) {
    throw new Error('Could not create the image.');
  }

  return uri;
}

/**
 * @param {string} uri
 */
export async function shareMarketingShareStory(uri) {
  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error('Sharing is not available on this device.');
  }
  await Sharing.shareAsync(uri, {
    mimeType: 'image/png',
    UTI: 'public.png',
    dialogTitle: 'Share',
  });
}

/**
 * @param {string} uri
 * @returns {Promise<string>} asset id
 */
export async function saveMarketingShareStoryToLibrary(uri) {
  const permission = await MediaLibrary.requestPermissionsAsync(true);
  if (!permission.granted) {
    throw new Error('Photo library access is needed to save the image.');
  }
  return (await MediaLibrary.createAssetAsync(uri)).id;
}
