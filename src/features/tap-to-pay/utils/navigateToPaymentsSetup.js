import { navigateNestedTabScreen } from '../../../navigation/navigateNestedTabScreen';
import { PAYMENTS_SCREEN_TAB } from '../../payments/constants/paymentsScreenTabs';
import { ROUTES } from '../../../routes/routes';

/**
 * More → Payments → Settings (subscribe / web access, or Stripe Connect setup).
 *
 * @param {*} navigation React Navigation object with `navigate`.
 */
export function navigateToPaymentsSetup(navigation) {
  navigateNestedTabScreen(navigation, {
    tab: ROUTES.MORE,
    screen: ROUTES.MORE_PAYMENTS,
    params: { initialTab: PAYMENTS_SCREEN_TAB.SETTINGS },
  });
}
