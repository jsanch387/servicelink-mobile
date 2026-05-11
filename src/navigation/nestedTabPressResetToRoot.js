import { CommonActions } from '@react-navigation/native';

/**
 * Nested stack screen currently shown for a tab route, when the child navigator state
 * is missing from the parent (e.g. deep link from root: `MainApp` → `More` → `BookingLink`
 * leaves `route.params.screen` before `route.state` is populated).
 *
 * @param {import('@react-navigation/native').Route<string> | undefined} activeRoute
 * @returns {string | null}
 */
function getNestedFocusedScreenName(activeRoute) {
  const nestedState = activeRoute?.state;
  if (nestedState?.routes?.length) {
    const idx =
      typeof nestedState.index === 'number' ? nestedState.index : nestedState.routes.length - 1;
    const name = nestedState.routes[idx]?.name;
    return typeof name === 'string' ? name : null;
  }
  const fromParams = activeRoute?.params?.screen;
  if (typeof fromParams === 'string' && fromParams.length > 0) {
    return fromParams;
  }
  return null;
}

/**
 * Bottom-tab helper: when the user taps the tab that is already focused, pop the tab's
 * nested stack to its root (e.g. BookingsList after opening BookingDetails from notifications).
 *
 * @param {{ navigation: import('@react-navigation/native').NavigationProp<Record<string, unknown>>; route: { name: string } }} args
 * @param {{ rootScreen: string }} options nested stack screen name for index 0
 */
export function nestedTabPressResetToRootListeners({ navigation, route }, { rootScreen }) {
  return {
    tabPress: (e) => {
      const state = navigation.getState?.();
      if (!state?.routes?.length) {
        return;
      }

      const activeRoute = state.routes[state.index];
      if (!activeRoute || activeRoute.name !== route.name) {
        return;
      }

      const focusedNestedName = getNestedFocusedScreenName(activeRoute);
      if (!focusedNestedName || focusedNestedName === rootScreen) {
        return;
      }

      e.preventDefault();
      navigation.dispatch(
        CommonActions.navigate({
          name: route.name,
          merge: true,
          params: { screen: rootScreen },
        }),
      );
    },
  };
}
