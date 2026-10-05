import { ROUTES } from '../../../routes/routes';

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
      const under = Array.isArray(destination.stackUnder) ? destination.stackUnder : [];
      const routes = [{ name: root }];
      for (const name of under) {
        if (name && name !== root && name !== destination.stackScreen) {
          routes.push({ name });
        }
      }
      if (destination.stackScreen !== root) {
        const route = { name: destination.stackScreen };
        if (destination.stackParams) route.params = destination.stackParams;
        routes.push(route);
      }
      navigation.navigate(ROUTES.MAIN_APP, {
        screen: destination.tab,
        params: {
          state: { routes, index: routes.length - 1 },
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
