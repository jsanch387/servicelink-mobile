import { ROUTES } from '../../../../routes/routes';
import {
  BOOKING_LINK_ANNOUNCEMENT_CONTACT_PARAMS,
  BOOKING_LINK_ANNOUNCEMENT_EDIT_PARAMS,
  BOOKING_LINK_ROUTE_PARAMS,
} from '../../../bookingLink/constants/bookingLinkRouteParams';
import { BOOKING_LINK_EDIT_TAB_DETAILS } from '../../../bookingLink/edit/constants/bookingLinkEditTabs';
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

  it('navigates to booking edit on root stack', () => {
    const navigation = nav();
    openNotificationTarget(navigation, { referenceType: 'booking_edit', referenceId: 'bid-edit' });
    expect(navigation.navigate).toHaveBeenCalledWith(ROUTES.EDIT_BOOKING, {
      bookingId: 'bid-edit',
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

  it('navigates to customer details from customers tab', () => {
    const navigation = nav();
    openNotificationTarget(navigation, { referenceType: 'customer', referenceId: 'cust-9' });
    expect(navigation.navigate).toHaveBeenCalledWith(ROUTES.MAIN_APP, {
      screen: ROUTES.CUSTOMERS,
      params: {
        state: {
          routes: [
            { name: ROUTES.CUSTOMERS_LIST },
            { name: ROUTES.CUSTOMER_DETAILS, params: { customerId: 'cust-9' } },
          ],
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

  it('navigates to home for broadcast screen slug', () => {
    const navigation = nav();
    openNotificationTarget(navigation, { referenceType: 'screen', referenceId: 'home' });
    expect(navigation.navigate).toHaveBeenCalledWith(ROUTES.MAIN_APP, { screen: ROUTES.HOME });
  });

  it('navigates to booking link edit for booking_link screen slug', () => {
    const navigation = nav();
    openNotificationTarget(navigation, { referenceType: 'screen', referenceId: 'booking_link' });
    expect(navigation.navigate).toHaveBeenCalledWith(ROUTES.MAIN_APP, {
      screen: ROUTES.MORE,
      params: {
        state: {
          routes: [
            { name: ROUTES.MORE_HOME },
            {
              name: ROUTES.BOOKING_LINK,
              params: BOOKING_LINK_ANNOUNCEMENT_EDIT_PARAMS,
            },
          ],
          index: 1,
        },
      },
    });
  });

  it('navigates to profile edit on booking link details tab', () => {
    const navigation = nav();
    openNotificationTarget(navigation, { referenceType: 'screen', referenceId: 'profile' });
    expect(navigation.navigate).toHaveBeenCalledWith(ROUTES.MAIN_APP, {
      screen: ROUTES.MORE,
      params: {
        state: {
          routes: [
            { name: ROUTES.MORE_HOME },
            {
              name: ROUTES.BOOKING_LINK,
              params: {
                [BOOKING_LINK_ROUTE_PARAMS.OPEN_EDIT]: true,
                [BOOKING_LINK_ROUTE_PARAMS.EDIT_TAB]: BOOKING_LINK_EDIT_TAB_DETAILS,
              },
            },
          ],
          index: 1,
        },
      },
    });
  });

  it('navigates to booking link contact tab for booking_link_contact screen slug', () => {
    const navigation = nav();
    openNotificationTarget(navigation, {
      referenceType: 'screen',
      referenceId: 'booking_link_contact',
    });
    expect(navigation.navigate).toHaveBeenCalledWith(ROUTES.MAIN_APP, {
      screen: ROUTES.MORE,
      params: {
        state: {
          routes: [
            { name: ROUTES.MORE_HOME },
            {
              name: ROUTES.BOOKING_LINK,
              params: BOOKING_LINK_ANNOUNCEMENT_CONTACT_PARAMS,
            },
          ],
          index: 1,
        },
      },
    });
  });

  it('falls back to home when type unknown', () => {
    const navigation = nav();
    openNotificationTarget(navigation, { referenceType: 'unknown', referenceId: '' });
    expect(navigation.navigate).toHaveBeenCalledWith(ROUTES.MAIN_APP, { screen: ROUTES.HOME });
  });

  it('falls back to bookings list when booking id missing', () => {
    const navigation = nav();
    openNotificationTarget(navigation, { referenceType: 'booking', referenceId: '' });
    expect(navigation.navigate).toHaveBeenCalledWith(ROUTES.MAIN_APP, {
      screen: ROUTES.BOOKINGS,
      params: {
        state: {
          routes: [{ name: ROUTES.BOOKINGS_LIST }],
          index: 0,
        },
      },
    });
  });
});
