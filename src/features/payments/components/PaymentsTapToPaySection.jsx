import { isTapToPayPlatformSupported } from '../../tap-to-pay/constants/tapToPayFeatureFlags';
import { PaymentTapToPayCard } from './PaymentTapToPayCard';

/** Tap to Pay on Payments — iOS only; in-app how-it-works explainer. */
export function PaymentsTapToPaySection() {
  if (!isTapToPayPlatformSupported()) {
    return null;
  }

  return <PaymentTapToPayCard />;
}
