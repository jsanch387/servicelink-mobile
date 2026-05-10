import { ROUTES } from '../../../../routes/routes';
import { openNotificationTarget } from '../openNotificationTarget';

function nav() {
  return { navigate: jest.fn() };
}

describe('openNotificationTarget', () => {
  it('navigates to booking details for booking reference', () => {
    const navigation = nav();
    openNotificationTarget(navigation, { referenceType: 'booking', referenceId: 'bid-1' });
    expect(navigation.navigate).toHaveBeenCalledWith(ROUTES.MAIN_APP, {
      screen: ROUTES.BOOKINGS,
      params: {
        screen: ROUTES.BOOKING_DETAILS,
        params: { bookingId: 'bid-1' },
      },
    });
  });

  it('treats appointment like booking', () => {
    const navigation = nav();
    openNotificationTarget(navigation, { referenceType: 'appointment', referenceId: 'aid-2' });
    expect(navigation.navigate).toHaveBeenCalledWith(
      ROUTES.MAIN_APP,
      expect.objectContaining({
        params: expect.objectContaining({
          params: { bookingId: 'aid-2' },
        }),
      }),
    );
  });

  it('navigates to quote detail when quote has id', () => {
    const navigation = nav();
    openNotificationTarget(navigation, { referenceType: 'quote', referenceId: 'q-1' });
    expect(navigation.navigate).toHaveBeenCalledWith(ROUTES.MAIN_APP, {
      screen: ROUTES.MORE,
      params: {
        screen: ROUTES.QUOTE_DETAIL,
        params: { quoteId: 'q-1' },
      },
    });
  });

  it('navigates to quotes list when quote has no id', () => {
    const navigation = nav();
    openNotificationTarget(navigation, { referenceType: 'quote', referenceId: '' });
    expect(navigation.navigate).toHaveBeenCalledWith(ROUTES.MAIN_APP, {
      screen: ROUTES.MORE,
      params: { screen: ROUTES.QUOTES },
    });
  });

  it.each(['payment', 'payout', 'deposit'])(
    'navigates to More payments for %s',
    (referenceType) => {
      const navigation = nav();
      openNotificationTarget(navigation, { referenceType, referenceId: 'x' });
      expect(navigation.navigate).toHaveBeenCalledWith(ROUTES.MAIN_APP, {
        screen: ROUTES.MORE,
        params: { screen: ROUTES.MORE_PAYMENTS },
      });
    },
  );

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
