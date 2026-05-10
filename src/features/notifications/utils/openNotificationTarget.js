import { ROUTES } from '../../../routes/routes';

/**
 * @param {*} navigation React Navigation object with `navigate`.
 * @param {{ referenceType: string; referenceId: string }} item
 */
export function openNotificationTarget(navigation, item) {
  const refType = (item.referenceType ?? '').toLowerCase();
  const id = String(item.referenceId ?? '').trim();

  if ((refType.includes('booking') || refType.includes('appointment')) && id) {
    navigation.navigate(ROUTES.MAIN_APP, {
      screen: ROUTES.BOOKINGS,
      params: {
        screen: ROUTES.BOOKING_DETAILS,
        params: { bookingId: id },
      },
    });
    return;
  }

  if (refType === 'quote') {
    if (id) {
      navigation.navigate(ROUTES.MAIN_APP, {
        screen: ROUTES.MORE,
        params: {
          screen: ROUTES.QUOTE_DETAIL,
          params: { quoteId: id },
        },
      });
    } else {
      navigation.navigate(ROUTES.MAIN_APP, {
        screen: ROUTES.MORE,
        params: { screen: ROUTES.QUOTES },
      });
    }
    return;
  }

  if (refType === 'payment' || refType === 'payout' || refType === 'deposit') {
    navigation.navigate(ROUTES.MAIN_APP, {
      screen: ROUTES.MORE,
      params: { screen: ROUTES.MORE_PAYMENTS },
    });
    return;
  }

  navigation.navigate(ROUTES.MAIN_APP, {
    screen: ROUTES.BOOKINGS,
    params: { screen: ROUTES.BOOKINGS_LIST },
  });
}
