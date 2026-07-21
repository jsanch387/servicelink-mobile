import { ROUTES } from '../../../routes/routes';
import {
  BOOKING_LINK_ANNOUNCEMENT_CONTACT_PARAMS,
  BOOKING_LINK_ANNOUNCEMENT_EDIT_PARAMS,
  BOOKING_LINK_ROUTE_PARAMS,
} from '../../bookingLink/constants/bookingLinkRouteParams';
import { BOOKING_LINK_EDIT_TAB_DETAILS } from '../../bookingLink/edit/constants/bookingLinkEditTabs';

/**
 * @typedef {{
 *   kind: 'main_app_tab';
 *   tab: string;
 *   stackScreen?: string;
 *   stackParams?: Record<string, unknown>;
 * }} MainAppTabDestination
 * @typedef {{
 *   kind: 'root_stack';
 *   screen: string;
 *   params?: Record<string, unknown>;
 * }} RootStackDestination
 * @typedef {{ kind: 'home' }} HomeDestination
 * @typedef {{ kind: 'notifications_inbox' }} NotificationsInboxDestination
 * @typedef {{ kind: 'noop' }} NoopDestination
 * @typedef {
 *   MainAppTabDestination
 *   | RootStackDestination
 *   | HomeDestination
 *   | NotificationsInboxDestination
 *   | NoopDestination
 * } PushDestination
 */

/** @type {Record<string, PushDestination>} */
const SCREEN_SLUG_DESTINATIONS = {
  home: { kind: 'main_app_tab', tab: ROUTES.HOME },
  bookings: { kind: 'main_app_tab', tab: ROUTES.BOOKINGS, stackScreen: ROUTES.BOOKINGS_LIST },
  quotes: { kind: 'main_app_tab', tab: ROUTES.MORE, stackScreen: ROUTES.QUOTES },
  customers: { kind: 'main_app_tab', tab: ROUTES.CUSTOMERS, stackScreen: ROUTES.CUSTOMERS_LIST },
  reviews: { kind: 'main_app_tab', tab: ROUTES.MORE, stackScreen: ROUTES.REVIEWS },
  payments: { kind: 'main_app_tab', tab: ROUTES.MORE, stackScreen: ROUTES.MORE_PAYMENTS },
  payments_connect: { kind: 'main_app_tab', tab: ROUTES.MORE, stackScreen: ROUTES.MORE_PAYMENTS },
  maintenance: { kind: 'main_app_tab', tab: ROUTES.MORE, stackScreen: ROUTES.MAINTENANCE },
  availability: { kind: 'main_app_tab', tab: ROUTES.MORE, stackScreen: ROUTES.AVAILABILITY },
  services: { kind: 'main_app_tab', tab: ROUTES.MORE, stackScreen: ROUTES.SERVICES_LIST },
  profile: {
    kind: 'main_app_tab',
    tab: ROUTES.MORE,
    stackScreen: ROUTES.BOOKING_LINK,
    stackParams: {
      [BOOKING_LINK_ROUTE_PARAMS.OPEN_EDIT]: true,
      [BOOKING_LINK_ROUTE_PARAMS.EDIT_TAB]: BOOKING_LINK_EDIT_TAB_DETAILS,
    },
  },
  booking_link: {
    kind: 'main_app_tab',
    tab: ROUTES.MORE,
    stackScreen: ROUTES.BOOKING_LINK,
    stackParams: BOOKING_LINK_ANNOUNCEMENT_EDIT_PARAMS,
  },
  booking_link_contact: {
    kind: 'main_app_tab',
    tab: ROUTES.MORE,
    stackScreen: ROUTES.BOOKING_LINK,
    stackParams: BOOKING_LINK_ANNOUNCEMENT_CONTACT_PARAMS,
  },
  marketing: { kind: 'main_app_tab', tab: ROUTES.MORE, stackScreen: ROUTES.MARKETING },
  qr_code: { kind: 'main_app_tab', tab: ROUTES.MORE, stackScreen: ROUTES.QR_CODE },
  upgrade: { kind: 'main_app_tab', tab: ROUTES.MORE, stackScreen: ROUTES.ACCOUNT_SETTINGS },
  settings: { kind: 'main_app_tab', tab: ROUTES.MORE, stackScreen: ROUTES.ACCOUNT_SETTINGS },
};

/**
 * Maps push `reference_type` + `reference_id` to an in-app destination.
 * Routing is driven only by these fields — never by notification title/body.
 *
 * @param {{ referenceType?: string; referenceId?: string }} input
 * @returns {PushDestination}
 */
export function resolvePushDestination({ referenceType, referenceId }) {
  const refType = String(referenceType ?? '')
    .trim()
    .toLowerCase();
  const id = String(referenceId ?? '').trim();

  if (refType === 'announcement' || refType === 'screen') {
    const slug = id.toLowerCase();
    const destination = SCREEN_SLUG_DESTINATIONS[slug];
    if (destination) {
      return destination;
    }
    if (__DEV__ && slug) {
      console.warn(`[push] unknown screen slug: ${slug}`);
    }
    return { kind: 'home' };
  }

  if (refType === 'booking_edit') {
    if (id) {
      return { kind: 'root_stack', screen: ROUTES.EDIT_BOOKING, params: { bookingId: id } };
    }
    return { kind: 'main_app_tab', tab: ROUTES.BOOKINGS, stackScreen: ROUTES.BOOKINGS_LIST };
  }

  if (refType === 'booking_request' || refType === 'booking' || refType === 'appointment') {
    if (id) {
      return {
        kind: 'main_app_tab',
        tab: ROUTES.BOOKINGS,
        stackScreen: ROUTES.BOOKING_DETAILS,
        stackParams: { bookingId: id },
      };
    }
    return { kind: 'main_app_tab', tab: ROUTES.BOOKINGS, stackScreen: ROUTES.BOOKINGS_LIST };
  }

  if (refType === 'quote_edit') {
    if (id) {
      return {
        kind: 'root_stack',
        screen: ROUTES.CREATE_QUOTE,
        params: { quoteRequestId: id },
      };
    }
    return { kind: 'main_app_tab', tab: ROUTES.MORE, stackScreen: ROUTES.QUOTES };
  }

  if (refType === 'quote') {
    if (id) {
      return {
        kind: 'main_app_tab',
        tab: ROUTES.MORE,
        stackScreen: ROUTES.QUOTE_DETAIL,
        stackParams: { quoteId: id },
      };
    }
    return { kind: 'main_app_tab', tab: ROUTES.MORE, stackScreen: ROUTES.QUOTES };
  }

  if (refType === 'customer') {
    if (id) {
      return {
        kind: 'main_app_tab',
        tab: ROUTES.CUSTOMERS,
        stackScreen: ROUTES.CUSTOMER_DETAILS,
        stackParams: { customerId: id },
      };
    }
    return { kind: 'main_app_tab', tab: ROUTES.CUSTOMERS, stackScreen: ROUTES.CUSTOMERS_LIST };
  }

  if (refType === 'review' || refType.includes('review')) {
    return { kind: 'main_app_tab', tab: ROUTES.MORE, stackScreen: ROUTES.REVIEWS };
  }

  if (refType === 'payment' || refType === 'payout' || refType === 'deposit') {
    return { kind: 'main_app_tab', tab: ROUTES.MORE, stackScreen: ROUTES.MORE_PAYMENTS };
  }

  if (!refType && !id) {
    return { kind: 'noop' };
  }

  if (__DEV__ && refType) {
    console.warn(`[push] unknown reference_type: ${refType}`);
  }

  return { kind: 'home' };
}
