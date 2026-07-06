import { ROUTES } from '../../../routes/routes';
import { navigateNestedTabScreen } from '../../../navigation/navigateNestedTabScreen';

/**
 * More → Payments (Pro upsell or Stripe Connect setup depending on subscription).
 *
 * @param {*} navigation React Navigation object with `navigate`.
 */
export function navigateToPaymentsSetup(navigation) {
  navigateNestedTabScreen(navigation, {
    tab: ROUTES.MORE,
    screen: ROUTES.MORE_PAYMENTS,
  });
}
