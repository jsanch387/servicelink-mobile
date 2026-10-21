import { MAIN_TAB_CONFIG, ROUTES } from '../routes/routes';
import { posthog } from './posthog';

const MAIN_TAB_ROUTES = new Set(MAIN_TAB_CONFIG.map((tab) => tab.route));

const TAB_LABEL_BY_ROUTE = Object.fromEntries(MAIN_TAB_CONFIG.map((tab) => [tab.route, tab.label]));

/** Last main tab we reported — avoids duplicate `tab_selected` on nested pushes. */
let lastTrackedTabRoute = null;

/**
 * Deepest focused route name from a React Navigation state tree.
 * @param {import('@react-navigation/native').NavigationState | undefined} state
 * @returns {string | null}
 */
export function getActiveRouteName(state) {
  if (!state?.routes?.length) return null;
  const index = typeof state.index === 'number' ? state.index : state.routes.length - 1;
  const route = state.routes[index];
  if (!route) return null;
  if (route.state) return getActiveRouteName(route.state);
  return typeof route.name === 'string' ? route.name : null;
}

/**
 * Which main tab owns the current leaf route (for dashboards).
 * @param {import('@react-navigation/native').NavigationState | undefined} state
 * @returns {{ tabRoute: string | null, tabLabel: string | null }}
 */
export function getActiveMainTab(state) {
  if (!state?.routes?.length) return { tabRoute: null, tabLabel: null };

  const index = typeof state.index === 'number' ? state.index : state.routes.length - 1;
  const route = state.routes[index];
  if (!route || typeof route.name !== 'string') return { tabRoute: null, tabLabel: null };

  if (route.name === ROUTES.MAIN_APP && route.state) {
    return getActiveMainTab(route.state);
  }

  if (MAIN_TAB_ROUTES.has(route.name)) {
    return {
      tabRoute: route.name,
      tabLabel: TAB_LABEL_BY_ROUTE[route.name] ?? route.name,
    };
  }

  if (route.state) return getActiveMainTab(route.state);
  return { tabRoute: null, tabLabel: null };
}

/**
 * Record a screen view with optional previous screen + main-tab context.
 * @param {{
 *   screenName: string | null | undefined;
 *   previousScreenName?: string | null;
 *   navigationState?: import('@react-navigation/native').NavigationState | undefined;
 * }} args
 */
export function trackScreenView({ screenName, previousScreenName = null, navigationState }) {
  if (!posthog || !screenName) return;

  const { tabRoute, tabLabel } = getActiveMainTab(navigationState);
  const properties = {};
  if (previousScreenName) properties.previous_screen = previousScreenName;
  if (tabRoute) properties.tab = tabRoute;
  if (tabLabel) properties.tab_label = tabLabel;

  posthog.screen(screenName, properties);

  if (tabRoute && tabRoute !== lastTrackedTabRoute) {
    lastTrackedTabRoute = tabRoute;
    posthog.capture('tab_selected', {
      tab: tabRoute,
      tab_label: tabLabel,
      screen: screenName,
      previous_screen: previousScreenName ?? undefined,
    });
  }
}
