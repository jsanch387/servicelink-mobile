import { ROUTES } from '../routes/routes';

/** Nested stack root screen per bottom tab (for back + tab re-tap). */
const TAB_STACK_ROOT = {
  [ROUTES.BOOKINGS]: ROUTES.BOOKINGS_LIST,
  [ROUTES.CUSTOMERS]: ROUTES.CUSTOMERS_LIST,
  [ROUTES.MORE]: ROUTES.MORE_HOME,
};

/**
 * @param {string} rootScreen
 * @param {string} targetScreen
 * @param {Record<string, unknown> | undefined} targetParams
 */
export function nestedStackState(rootScreen, targetScreen, targetParams) {
  if (targetScreen === rootScreen) {
    return { routes: [{ name: rootScreen }], index: 0 };
  }
  return {
    routes: [{ name: rootScreen }, { name: targetScreen, params: targetParams ?? undefined }],
    index: 1,
  };
}

/**
 * Navigate to a screen inside a bottom tab from outside the tab navigator (e.g. root stack).
 *
 * @param {*} navigation React Navigation object with `navigate`.
 * @param {{ tab: string; screen?: string; params?: Record<string, unknown> }} target
 */
export function navigateNestedTabScreen(navigation, { tab, screen, params }) {
  const root = TAB_STACK_ROOT[tab] ?? tab;
  navigation.navigate(ROUTES.MAIN_APP, {
    screen: tab,
    params: screen ? { state: nestedStackState(root, screen, params) } : undefined,
  });
}
