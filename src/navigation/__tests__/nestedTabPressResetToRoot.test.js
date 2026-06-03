import { CommonActions } from '@react-navigation/native';
import { ROUTES } from '../../routes/routes';
import { nestedTabPressResetToRootListeners } from '../nestedTabPressResetToRoot';

describe('nestedTabPressResetToRootListeners', () => {
  it('resets nested stack built via `state` when the tab is pressed again', () => {
    const preventDefault = jest.fn();
    const dispatch = jest.fn();
    const navigation = {
      getState: () => ({
        index: 2,
        routes: [
          { name: ROUTES.HOME },
          { name: ROUTES.BOOKINGS },
          {
            name: ROUTES.MORE,
            state: {
              index: 1,
              routes: [{ name: ROUTES.MORE_HOME }, { name: ROUTES.REVIEWS }],
            },
          },
        ],
      }),
      dispatch,
    };

    const listeners = nestedTabPressResetToRootListeners(
      { navigation, route: { name: ROUTES.MORE } },
      { rootScreen: ROUTES.MORE_HOME },
    );

    listeners.tabPress({ preventDefault });

    expect(preventDefault).toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith(
      CommonActions.navigate({
        name: ROUTES.MORE,
        merge: true,
        params: {
          state: {
            routes: [{ name: ROUTES.MORE_HOME }],
            index: 0,
          },
        },
      }),
    );
  });
});
