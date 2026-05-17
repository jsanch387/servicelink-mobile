import { ROUTES } from '../../../routes/routes';

/**
 * @param {Pick<import('@react-navigation/native').NavigationProp<Record<string, unknown>>, 'navigate'>} navigation
 */
export function navigateToUpgradePlan(navigation) {
  navigation.navigate(ROUTES.UPGRADE_PLAN);
}
