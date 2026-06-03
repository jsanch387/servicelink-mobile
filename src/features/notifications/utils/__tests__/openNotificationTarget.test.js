import { ROUTES } from '../../../../routes/routes';
import { openNotificationTarget } from '../openNotificationTarget';

function nav() {
  return { navigate: jest.fn() };
}

describe('openNotificationTarget', () => {
  it('navigates to booking details with list under stack (back + tab reset)', () => {
    const navigation = nav();
    openNotificationTarget(navigation, { referenceType: 'booking', referenceId: 'bid-1' });
    expect(navigation.navigate).toHaveBeenCalledWith(ROUTES.MAIN_APP, {
      screen: ROUTES.BOOKINGS,
      params: {
        state: {
          routes: [
            { name: ROUTES.BOOKINGS_LIST },
            { name: ROUTES.BOOKING_DETAILS, params: { bookingId: 'bid-1' } },
          ],
          index: 1,
        },
      },
    });
  });

  it('treats appointment like booking', () => {
    const navigation = nav();
    openNotificationTarget(navigation, { referenceType: 'appointment', referenceId: 'aid-2' });
    expect(navigation.navigate).toHaveBeenCalledWith(ROUTES.MAIN_APP, {
      screen: ROUTES.BOOKINGS,
      params: {
        state: {
          routes: [
            { name: ROUTES.BOOKINGS_LIST },
            { name: ROUTES.BOOKING_DETAILS, params: { bookingId: 'aid-2' } },
          ],
          index: 1,
        },
      },
    });
  });

  it('navigates to quote detail with More home under stack', () => {
    const navigation = nav();
    openNotificationTarget(navigation, { referenceType: 'quote', referenceId: 'q-1' });
    expect(navigation.navigate).toHaveBeenCalledWith(ROUTES.MAIN_APP, {
      screen: ROUTES.MORE,
      params: {
        state: {
          routes: [
            { name: ROUTES.MORE_HOME },
            { name: ROUTES.QUOTE_DETAIL, params: { quoteId: 'q-1' } },
          ],
          index: 1,
        },
      },
    });
  });

  it('navigates to quotes list with More home under stack', () => {
    const navigation = nav();
    openNotificationTarget(navigation, { referenceType: 'quote', referenceId: '' });
    expect(navigation.navigate).toHaveBeenCalledWith(ROUTES.MAIN_APP, {
      screen: ROUTES.MORE,
      params: {
        state: {
          routes: [{ name: ROUTES.MORE_HOME }, { name: ROUTES.QUOTES }],
          index: 1,
        },
      },
    });
  });

  it.each(['payment', 'payout', 'deposit'])(
    'navigates to More payments for %s',
    (referenceType) => {
      const navigation = nav();
      openNotificationTarget(navigation, { referenceType, referenceId: 'x' });
      expect(navigation.navigate).toHaveBeenCalledWith(ROUTES.MAIN_APP, {
        screen: ROUTES.MORE,
        params: {
          state: {
            routes: [{ name: ROUTES.MORE_HOME }, { name: ROUTES.MORE_PAYMENTS }],
            index: 1,
          },
        },
      });
    },
  );

  it('navigates to More reviews for review (reference_id ignored for list-only deep link)', () => {
    const navigation = nav();
    openNotificationTarget(navigation, { referenceType: 'review', referenceId: 'rev-1' });
    expect(navigation.navigate).toHaveBeenCalledWith(ROUTES.MAIN_APP, {
      screen: ROUTES.MORE,
      params: {
        state: {
          routes: [{ name: ROUTES.MORE_HOME }, { name: ROUTES.REVIEWS }],
          index: 1,
        },
      },
    });
  });

  it('falls back to bookings list when type unknown', () => {
    const navigation = nav();
    openNotificationTarget(navigation, { referenceType: 'unknown', referenceId: '' });
    expect(navigation.navigate).toHaveBeenCalledWith(ROUTES.MAIN_APP, {
      screen: ROUTES.BOOKINGS,
      params: { screen: ROUTES.BOOKINGS_LIST },
    });
  });

  it('falls back to bookings list when booking id missing', () => {
    const navigation = nav();
    openNotificationTarget(navigation, { referenceType: 'booking', referenceId: '' });
    expect(navigation.navigate).toHaveBeenCalledWith(ROUTES.MAIN_APP, {
      screen: ROUTES.BOOKINGS,
      params: { screen: ROUTES.BOOKINGS_LIST },
    });
  });
});
