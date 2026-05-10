import { ROUTES } from '../../../routes/routes';

/**
 * Build nested stack `state` so the list/root screen stays under the target (back + tab re-tap work).
 * @param {string} rootScreen
 * @param {string} targetScreen
 * @param {Record<string, unknown> | undefined} targetParams
 */
function nestedStackState(rootScreen, targetScreen, targetParams) {
  if (targetScreen === rootScreen) {
    return { routes: [{ name: rootScreen }], index: 0 };
  }
  return {
    routes: [{ name: rootScreen }, { name: targetScreen, params: targetParams ?? undefined }],
    index: 1,
  };
}

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
        state: nestedStackState(ROUTES.BOOKINGS_LIST, ROUTES.BOOKING_DETAILS, { bookingId: id }),
      },
    });
    return;
  }

  if (refType === 'quote') {
    if (id) {
      navigation.navigate(ROUTES.MAIN_APP, {
        screen: ROUTES.MORE,
        params: {
          state: nestedStackState(ROUTES.MORE_HOME, ROUTES.QUOTE_DETAIL, { quoteId: id }),
        },
      });
    } else {
      navigation.navigate(ROUTES.MAIN_APP, {
        screen: ROUTES.MORE,
        params: {
          state: nestedStackState(ROUTES.MORE_HOME, ROUTES.QUOTES),
        },
      });
    }
    return;
  }

  if (refType === 'payment' || refType === 'payout' || refType === 'deposit') {
    navigation.navigate(ROUTES.MAIN_APP, {
      screen: ROUTES.MORE,
      params: {
        state: nestedStackState(ROUTES.MORE_HOME, ROUTES.MORE_PAYMENTS),
      },
    });
    return;
  }

  navigation.navigate(ROUTES.MAIN_APP, {
    screen: ROUTES.BOOKINGS,
    params: { screen: ROUTES.BOOKINGS_LIST },
  });
}
