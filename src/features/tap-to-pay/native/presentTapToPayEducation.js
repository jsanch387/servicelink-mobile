import { Platform } from 'react-native';
import {
  isTapToPayEducationNativeAvailable,
  isTapToPayEducationNativeModuleLinked,
  presentTapToPayEducationNative,
} from 'servicelink-tap-to-pay-education';
import { markTapToPayEducationSeen } from '../education/tapToPayEducationStorage';

export { isTapToPayEducationNativeModuleLinked } from 'servicelink-tap-to-pay-education';
export {
  clearTapToPayEducationSeen,
  hasSeenTapToPayEducation,
  markTapToPayEducationSeen,
} from '../education/tapToPayEducationStorage';

/**
 * Whether Apple ProximityReaderDiscovery education can be presented (iOS 18+ dev/production build).
 */
export function isTapToPayEducationAvailable() {
  if (Platform.OS !== 'ios') {
    return false;
  }
  if (!isTapToPayEducationNativeModuleLinked()) {
    return false;
  }
  return isTapToPayEducationNativeAvailable();
}

export function getTapToPayEducationUnavailableMessage() {
  if (Platform.OS !== 'ios') {
    return 'Tap to Pay education is only available on iPhone.';
  }
  if (!isTapToPayEducationNativeModuleLinked()) {
    return (
      'This JS bundle expects the Tap to Pay education native module, but the app on your phone was built without it. ' +
      'If expo run:ios showed an install error, open ios/ServiceLink.xcworkspace in Xcode and Run on your iPhone.'
    );
  }
  return 'Requires iOS 18+ and the Tap to Pay entitlement on a physical iPhone.';
}

/**
 * Presents Apple's system "How to Tap" merchant education sheet.
 * Independent of Stripe T&C — safe to call after terms were already accepted.
 *
 * @param {{ markSeen?: boolean }} [options]
 */
export async function presentTapToPayEducation({ markSeen = true } = {}) {
  await presentTapToPayEducationNative();
  if (markSeen) {
    await markTapToPayEducationSeen();
  }
}
