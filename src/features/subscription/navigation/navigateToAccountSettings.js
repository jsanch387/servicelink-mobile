import { navigationRef } from '../../../navigation/navigationRef';
import { ROUTES } from '../../../routes/routes';

/** Opens More → Account from any signed-in root stack (e.g. after Stripe upgrade). */
export function navigateToAccountSettings() {
  if (!navigationRef.isReady()) {
    return;
  }
  navigationRef.navigate(ROUTES.MAIN_APP, {
    screen: ROUTES.MORE,
    params: { screen: ROUTES.ACCOUNT_SETTINGS },
  });
}
