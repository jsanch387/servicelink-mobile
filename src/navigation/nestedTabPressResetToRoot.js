import { CommonActions } from '@react-navigation/native';

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

      const nestedState = activeRoute.state;
      if (!nestedState?.routes?.length) {
        return;
      }

      const focusedNested = nestedState.routes[nestedState.index];
      /** Covers [List, Details] and the edge case [Details] only (index 0, no list under back). */
      if (focusedNested?.name === rootScreen) {
        return;
      }

      e.preventDefault();
      navigation.dispatch(
        CommonActions.navigate({
          name: route.name,
          params: { screen: rootScreen },
        }),
      );
    },
  };
}
