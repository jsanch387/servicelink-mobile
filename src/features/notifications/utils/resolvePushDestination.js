import { PATHS, ROUTES } from '../../../routes/routes';
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
 *   stackUnder?: string[];
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
  expenses: { kind: 'main_app_tab', tab: ROUTES.MORE, stackScreen: ROUTES.EXPENSES },
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
  /** Notification settings (More → Notifications). Path: `/more/notifications`. */
  notification_settings: {
    kind: 'main_app_tab',
    tab: ROUTES.MORE,
    stackScreen: ROUTES.NOTIFICATIONS,
  },
  notifications: {
    kind: 'main_app_tab',
    tab: ROUTES.MORE,
    stackScreen: ROUTES.NOTIFICATIONS,
  },
  upgrade: { kind: 'main_app_tab', tab: ROUTES.MORE, stackScreen: ROUTES.ACCOUNT_SETTINGS },
  settings: { kind: 'main_app_tab', tab: ROUTES.MORE, stackScreen: ROUTES.ACCOUNT_SETTINGS },
  account: { kind: 'main_app_tab', tab: ROUTES.MORE, stackScreen: ROUTES.ACCOUNT_SETTINGS },
  subscriptions: { kind: 'main_app_tab', tab: ROUTES.MORE, stackScreen: ROUTES.SUBSCRIPTIONS },
  team: { kind: 'main_app_tab', tab: ROUTES.MORE, stackScreen: ROUTES.TEAM },
  teams: { kind: 'main_app_tab', tab: ROUTES.MORE, stackScreen: ROUTES.TEAM },
  help: { kind: 'main_app_tab', tab: ROUTES.MORE, stackScreen: ROUTES.HELP },
  support: { kind: 'main_app_tab', tab: ROUTES.MORE, stackScreen: ROUTES.SUPPORT },
  contact: { kind: 'main_app_tab', tab: ROUTES.MORE, stackScreen: ROUTES.SUPPORT },
  legal: { kind: 'main_app_tab', tab: ROUTES.MORE, stackScreen: ROUTES.LEGAL },
  privacy: { kind: 'main_app_tab', tab: ROUTES.MORE, stackScreen: ROUTES.LEGAL },
  more: { kind: 'main_app_tab', tab: ROUTES.MORE, stackScreen: ROUTES.MORE_HOME },
  sent_texts: { kind: 'main_app_tab', tab: ROUTES.MORE, stackScreen: ROUTES.SENT_TEXTS },
  customer_texts: {
    kind: 'main_app_tab',
    tab: ROUTES.MORE,
    stackScreen: ROUTES.CUSTOMER_SMS_UPSELL,
  },
  customer_sms: {
    kind: 'main_app_tab',
    tab: ROUTES.MORE,
    stackScreen: ROUTES.CUSTOMER_SMS_UPSELL,
  },
  inbox: { kind: 'notifications_inbox' },
  create_appointment: { kind: 'root_stack', screen: ROUTES.CREATE_APPOINTMENT },
  create_payment: { kind: 'root_stack', screen: ROUTES.CREATE_PAYMENT },
  create_quote: { kind: 'root_stack', screen: ROUTES.CREATE_QUOTE },
};

/**
 * Path-style `reference_id` values (deep links) → same destinations as screen slugs.
 * Leading-slash paths also match without the slash (`/more/team` and `more/team`).
 * @type {Record<string, PushDestination>}
 */
const PATH_DESTINATIONS = Object.fromEntries(
  [
    [PATHS.BOOKINGS, SCREEN_SLUG_DESTINATIONS.bookings],
    [PATHS.BOOKINGS_LIST, SCREEN_SLUG_DESTINATIONS.bookings],
    [PATHS.CUSTOMERS, SCREEN_SLUG_DESTINATIONS.customers],
    [PATHS.CUSTOMERS_LIST, SCREEN_SLUG_DESTINATIONS.customers],
    [PATHS.SERVICES, SCREEN_SLUG_DESTINATIONS.services],
    [PATHS.SERVICES_LIST, SCREEN_SLUG_DESTINATIONS.services],
    [PATHS.AVAILABILITY, SCREEN_SLUG_DESTINATIONS.availability],
    [PATHS.QUOTES, SCREEN_SLUG_DESTINATIONS.quotes],
    [PATHS.REVIEWS, SCREEN_SLUG_DESTINATIONS.reviews],
    [PATHS.MAINTENANCE, SCREEN_SLUG_DESTINATIONS.maintenance],
    [PATHS.TEAM, SCREEN_SLUG_DESTINATIONS.team],
    [PATHS.SUBSCRIPTIONS, SCREEN_SLUG_DESTINATIONS.subscriptions],
    [PATHS.BOOKING_LINK, SCREEN_SLUG_DESTINATIONS.booking_link],
    [PATHS.QR_CODE, SCREEN_SLUG_DESTINATIONS.qr_code],
    [PATHS.MARKETING, SCREEN_SLUG_DESTINATIONS.marketing],
    [PATHS.MORE_PAYMENTS, SCREEN_SLUG_DESTINATIONS.payments],
    [PATHS.PAYMENTS, SCREEN_SLUG_DESTINATIONS.payments],
    [PATHS.EXPENSES, SCREEN_SLUG_DESTINATIONS.expenses],
    [PATHS.MORE, SCREEN_SLUG_DESTINATIONS.more],
    [PATHS.MORE_HOME, SCREEN_SLUG_DESTINATIONS.more],
    [PATHS.ACCOUNT_SETTINGS, SCREEN_SLUG_DESTINATIONS.account],
    [PATHS.NOTIFICATIONS, SCREEN_SLUG_DESTINATIONS.notification_settings],
    [PATHS.SENT_TEXTS, SCREEN_SLUG_DESTINATIONS.sent_texts],
    [PATHS.CUSTOMER_SMS_UPSELL, SCREEN_SLUG_DESTINATIONS.customer_texts],
    [PATHS.NOTIFICATIONS_INBOX, SCREEN_SLUG_DESTINATIONS.inbox],
    [PATHS.CREATE_APPOINTMENT, SCREEN_SLUG_DESTINATIONS.create_appointment],
    [PATHS.CREATE_PAYMENT, SCREEN_SLUG_DESTINATIONS.create_payment],
    [PATHS.CREATE_QUOTE, SCREEN_SLUG_DESTINATIONS.create_quote],
    [PATHS.SUPPORT, SCREEN_SLUG_DESTINATIONS.support],
    [PATHS.HELP, SCREEN_SLUG_DESTINATIONS.help],
    [PATHS.LEGAL, SCREEN_SLUG_DESTINATIONS.legal],
  ].flatMap(([path, destination]) => {
    const normalized = String(path).trim().toLowerCase();
    if (!normalized.startsWith('/')) {
      return [[normalized, destination]];
    }
    return [
      [normalized, destination],
      [normalized.slice(1), destination],
    ];
  }),
);

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
    const destination =
      SCREEN_SLUG_DESTINATIONS[slug] ??
      PATH_DESTINATIONS[slug] ??
      PATH_DESTINATIONS[slug.startsWith('/') ? slug : `/${slug}`];
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

  /** New subscriber / visit-needed: `reference_id` is `customer_memberships.id`. */
  if (refType === 'subscriber' || refType === 'membership') {
    if (id) {
      return {
        kind: 'main_app_tab',
        tab: ROUTES.MORE,
        stackScreen: ROUTES.SUBSCRIPTION_DETAIL,
        stackParams: { subscriptionId: id },
      };
    }
    return { kind: 'main_app_tab', tab: ROUTES.MORE, stackScreen: ROUTES.SUBSCRIPTIONS };
  }

  if (refType === 'review' || refType.includes('review')) {
    return { kind: 'main_app_tab', tab: ROUTES.MORE, stackScreen: ROUTES.REVIEWS };
  }

  /** Invoice paid: `reference_id` is `invoices.id`. Missing id opens the list. */
  if (refType === 'invoice') {
    if (id) {
      return {
        kind: 'main_app_tab',
        tab: ROUTES.MORE,
        stackScreen: ROUTES.INVOICE_DETAIL,
        stackParams: { invoiceId: id },
        stackUnder: [ROUTES.INVOICES],
      };
    }
    return { kind: 'main_app_tab', tab: ROUTES.MORE, stackScreen: ROUTES.INVOICES };
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
