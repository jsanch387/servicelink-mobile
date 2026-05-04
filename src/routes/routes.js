/**
 * Single source of truth: stack/tab names, paths, and main tab bar config.
 * Import `ROUTES` / `PATHS` / `MAIN_TAB_CONFIG` — do not hardcode screen names in UI.
 */

export const ROUTES = {
  LOGIN: 'Login',
  SIGN_UP: 'SignUp',
  /** First-time signup — blocks main tabs until finished */
  ONBOARDING: 'Onboarding',
  /** Stack screen that hosts the bottom tab navigator */
  MAIN_APP: 'MainApp',
  HOME: 'Home',
  BOOKINGS: 'Bookings',
  BOOKINGS_LIST: 'BookingsList',
  BOOKING_DETAILS: 'BookingDetails',
  CUSTOMERS: 'Customers',
  CUSTOMERS_LIST: 'CustomersList',
  CUSTOMER_DETAILS: 'CustomerDetails',
  SERVICES: 'Services',
  SERVICES_LIST: 'ServicesList',
  SERVICES_EDIT: 'ServicesEdit',
  AVAILABILITY: 'Availability',
  QUOTES: 'Quotes',
  BOOKING_LINK: 'BookingLink',
  MORE_PAYMENTS: 'MorePayments',
  PAYMENTS: 'Payments',
  /** Bottom tab: More (settings, business tools, support) */
  MORE: 'More',
  MORE_HOME: 'MoreHome',
  /** Stack screen name shown in devtools; path is `/more/account`. */
  ACCOUNT_SETTINGS: 'Account',
  /** More stack — push notification preferences. */
  NOTIFICATIONS: 'Notifications',
  /** Root stack — inbox from Home bell (back returns to tabs). */
  NOTIFICATIONS_INBOX: 'NotificationsInbox',
  /** Root stack — new appointment from home FAB (back returns to tabs). */
  CREATE_APPOINTMENT: 'CreateAppointment',
  HELP: 'Help',
};

export const PATHS = {
  LOGIN: '/login',
  SIGN_UP: '/sign-up',
  ONBOARDING: '/onboarding',
  HOME: '/',
  BOOKINGS: '/bookings',
  BOOKINGS_LIST: '/bookings/list',
  BOOKING_DETAILS: '/bookings/:bookingId',
  CUSTOMERS: '/customers',
  CUSTOMERS_LIST: '/customers/list',
  CUSTOMER_DETAILS: '/customers/:customerId',
  SERVICES: '/services',
  SERVICES_LIST: '/services/list',
  SERVICES_EDIT: '/services/:serviceId/edit',
  AVAILABILITY: '/availability',
  QUOTES: '/quotes',
  BOOKING_LINK: '/booking-link',
  MORE_PAYMENTS: '/more/payments',
  PAYMENTS: '/payments',
  MORE: '/more',
  MORE_HOME: '/more/home',
  ACCOUNT_SETTINGS: '/more/account',
  NOTIFICATIONS: '/more/notifications',
  NOTIFICATIONS_INBOX: '/notifications',
  CREATE_APPOINTMENT: '/create-appointment',
  HELP: '/more/help',
};

/** Bottom tabs: order, labels, and Ionicons glyph names. */
export const MAIN_TAB_CONFIG = [
  { route: ROUTES.HOME, label: 'Home', icon: 'home-outline' },
  { route: ROUTES.BOOKINGS, label: 'Bookings', icon: 'calendar-outline' },
  { route: ROUTES.CUSTOMERS, label: 'Customers', icon: 'people-outline' },
  // { route: ROUTES.PAYMENTS, label: 'Payments', icon: 'card-outline' },
  { route: ROUTES.MORE, label: 'More', icon: 'ellipsis-horizontal' },
];
