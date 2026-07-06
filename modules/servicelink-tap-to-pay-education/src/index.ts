import { requireNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

type ServicelinkTapToPayEducationNativeModule = {
  isAvailableAsync(): boolean;
  presentHowToTapAsync(): Promise<void>;
};

let nativeModule: ServicelinkTapToPayEducationNativeModule | null | undefined;

function getNativeModule(): ServicelinkTapToPayEducationNativeModule | null {
  if (Platform.OS !== 'ios') {
    return null;
  }

  if (nativeModule !== undefined) {
    return nativeModule;
  }

  try {
    nativeModule = requireNativeModule('ServicelinkTapToPayEducation');
  } catch {
    nativeModule = null;
  }

  return nativeModule;
}

/** True when the Expo native module is compiled into the current app binary. */
export function isTapToPayEducationNativeModuleLinked(): boolean {
  return getNativeModule() != null;
}

export function isTapToPayEducationNativeAvailable(): boolean {
  const module = getNativeModule();
  if (!module) {
    return false;
  }

  try {
    return module.isAvailableAsync();
  } catch {
    return false;
  }
}

export async function presentTapToPayEducationNative(): Promise<void> {
  const module = getNativeModule();
  if (!module) {
    throw new Error(
      'Tap to Pay education native module is not in this build. Rebuild the iOS app (npx expo run:ios --device).',
    );
  }

  if (!module.isAvailableAsync()) {
    throw new Error('Tap to Pay education requires iOS 18 or later.');
  }

  await module.presentHowToTapAsync();
}
