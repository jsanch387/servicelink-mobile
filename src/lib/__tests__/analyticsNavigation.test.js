import { MAIN_TAB_CONFIG, ROUTES } from '../../routes/routes';
import { getActiveMainTab, getActiveRouteName } from '../analyticsNavigation';

describe('analyticsNavigation', () => {
  it('returns the deepest focused route name', () => {
    const state = {
      index: 0,
      routes: [
        {
          name: ROUTES.MAIN_APP,
          state: {
            index: 1,
            routes: [
              { name: ROUTES.HOME },
              {
                name: ROUTES.BOOKINGS,
                state: {
                  index: 1,
                  routes: [{ name: ROUTES.BOOKINGS_LIST }, { name: ROUTES.BOOKING_DETAILS }],
                },
              },
            ],
          },
        },
      ],
    };

    expect(getActiveRouteName(state)).toBe(ROUTES.BOOKING_DETAILS);
  });

  it('resolves the active main tab label for nested screens', () => {
    const bookingsLabel = MAIN_TAB_CONFIG.find((tab) => tab.route === ROUTES.BOOKINGS)?.label;
    const state = {
      index: 0,
      routes: [
        {
          name: ROUTES.MAIN_APP,
          state: {
            index: 1,
            routes: [
              { name: ROUTES.HOME },
              {
                name: ROUTES.BOOKINGS,
                state: {
                  index: 0,
                  routes: [{ name: ROUTES.BOOKINGS_LIST }],
                },
              },
            ],
          },
        },
      ],
    };

    expect(getActiveMainTab(state)).toEqual({
      tabRoute: ROUTES.BOOKINGS,
      tabLabel: bookingsLabel,
    });
  });
});
