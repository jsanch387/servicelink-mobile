import { ROUTES } from '../../../routes/routes';
import { nestedStackState } from '../../../navigation/navigateNestedTabScreen';

/** Nested stack root screen per bottom tab (for back + tab re-tap). */
const TAB_STACK_ROOT = {
  [ROUTES.BOOKINGS]: ROUTES.BOOKINGS_LIST,
  [ROUTES.CUSTOMERS]: ROUTES.CUSTOMERS_LIST,
  [ROUTES.MORE]: ROUTES.MORE_HOME,
};

/**
 * @param {*} navigation React Navigation object with `navigate`.
 * @param {import('./resolvePushDestination').PushDestination} destination
 */
export function navigateToPushDestination(navigation, destination) {
  if (!destination || destination.kind === 'noop') {
    return;
  }

  if (destination.kind === 'home') {
    navigation.navigate(ROUTES.MAIN_APP, { screen: ROUTES.HOME });
    return;
  }

  if (destination.kind === 'notifications_inbox') {
    navigation.navigate(ROUTES.NOTIFICATIONS_INBOX);
    return;
  }

  if (destination.kind === 'root_stack') {
    navigation.navigate(destination.screen, destination.params);
    return;
  }

  if (destination.kind === 'main_app_tab') {
    const root = TAB_STACK_ROOT[destination.tab] ?? destination.tab;
    if (destination.stackScreen) {
      navigation.navigate(ROUTES.MAIN_APP, {
        screen: destination.tab,
        params: {
          state: nestedStackState(root, destination.stackScreen, destination.stackParams),
        },
      });
      return;
    }

    navigation.navigate(ROUTES.MAIN_APP, {
      screen: destination.tab,
      params: root !== destination.tab ? { screen: root } : undefined,
    });
  }
}
