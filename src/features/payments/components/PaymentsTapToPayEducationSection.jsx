import { isTapToPayPlatformSupported } from '../../tap-to-pay/constants/tapToPayFeatureFlags';
import { isTapToPayEducationNativeModuleLinked } from '../../tap-to-pay/native/presentTapToPayEducation';
import { PaymentTapToPayEducationCard } from '../components/PaymentTapToPayEducationCard';

/**
 * Tap to Pay education entry on Payments — iOS dev/production builds with the native module only.
 */
export function PaymentsTapToPayEducationSection() {
  if (!isTapToPayPlatformSupported() || !isTapToPayEducationNativeModuleLinked()) {
    return null;
  }

  return <PaymentTapToPayEducationCard />;
}
