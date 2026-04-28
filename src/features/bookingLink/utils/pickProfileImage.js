import * as ImagePicker from 'expo-image-picker';
import { ActionSheetIOS, Alert, Platform } from 'react-native';

/** Wide hero, close to profile cover (16 / 8.2). */
const COVER_CROP_ASPECT = [80, 41];
const SQUARE_CROP_ASPECT = [1, 1];

const IOS_OPTIONS = ['Cancel', 'Choose a photo', 'Take a new photo'];

async function pickFromLibrary(aspect) {
  const { status, canAskAgain } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      'Photo access',
      canAskAgain
        ? 'We need access to your photos for this.'
        : 'Photo access is off. You can turn it on in Settings for this app.',
    );
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect,
    quality: 0.88,
  });
  if (result.canceled) {
    return null;
  }
  return result.assets[0]?.uri ?? null;
}

async function pickFromCamera(aspect) {
  const { status, canAskAgain } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      'Camera access',
      canAskAgain
        ? 'We need the camera for this.'
        : 'Camera access is off. You can enable it in Settings for this app.',
    );
    return null;
  }
  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect,
    quality: 0.88,
  });
  if (result.canceled) {
    return null;
  }
  return result.assets[0]?.uri ?? null;
}

/**
 * @param {{ aspect: [number, number], title: string, message: string }} config
 * @returns {Promise<string | null>}
 */
export function pickProfileImageUri(config) {
  const { aspect, message, title } = config;

  if (Platform.OS === 'ios') {
    return new Promise((resolve) => {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          cancelButtonIndex: 0,
          options: IOS_OPTIONS,
          title,
          message,
          userInterfaceStyle: 'automatic',
        },
        async (buttonIndex) => {
          if (buttonIndex === 1) {
            resolve(await pickFromLibrary(aspect));
            return;
          }
          if (buttonIndex === 2) {
            resolve(await pickFromCamera(aspect));
            return;
          }
          resolve(null);
        },
      );
    });
  }

  return new Promise((resolve) => {
    Alert.alert(title, message, [
      {
        text: 'Choose a photo',
        onPress: () => void pickFromLibrary(aspect).then(resolve),
      },
      {
        text: 'Take a new photo',
        onPress: () => void pickFromCamera(aspect).then(resolve),
      },
      {
        style: 'cancel',
        text: 'Not now',
        onPress: () => resolve(null),
      },
    ]);
  });
}

export function pickCoverPhotoUri() {
  return pickProfileImageUri({
    aspect: COVER_CROP_ASPECT,
    message: `Pick something welcoming—your cover is the first impression when someone opens your link.`,
    title: 'Cover photo',
  });
}

export function pickLogoPhotoUri() {
  return pickProfileImageUri({
    aspect: SQUARE_CROP_ASPECT,
    message: 'A clear, square-friendly mark works best next to your name.',
    title: 'Business logo',
  });
}

export function pickGalleryPhotoUri() {
  return pickProfileImageUri({
    aspect: SQUARE_CROP_ASPECT,
    message: 'Add a strong photo of your work—it will show in your public gallery.',
    title: 'Gallery photo',
  });
}
