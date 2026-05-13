/**
 * Single source of truth: stack/tab names, paths, and main tab bar config.
 * Import `ROUTES` / `PATHS` / `MAIN_TAB_CONFIG` — do not hardcode screen names in UI.
 */

export const ROUTES = {
  LOGIN: 'Login',
  SIGN_UP: 'SignUp',
  /** After email/password sign-up when Supabase requires email confirmation */
  CHECK_YOUR_EMAIL: 'CheckYourEmail',
  /** Opens ServiceLink forgot-password in the system browser */
  FORGOT_PASSWORD: 'ForgotPassword',
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
  /** More stack — quote request or sent quote detail. */
  QUOTE_DETAIL: 'QuoteDetail',
  /** Root stack — build & send quote (hides tab bar; same pattern as CREATE_APPOINTMENT). */
  CREATE_QUOTE: 'CreateQuote',
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
  /** Root stack — future global subscription gate/paywall. */
  UPGRADE_PAYWALL: 'UpgradePaywall',
  HELP: 'Help',
  /** More stack — privacy policy & terms of service (hosted web links). */
  LEGAL: 'Legal',
};

export const PATHS = {
  LOGIN: '/login',
  SIGN_UP: '/sign-up',
  /** Next.js public route (opened in system browser from mobile). */
  AUTH_FORGOT_PASSWORD: '/auth/forgot-password',
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
  QUOTE_DETAIL: '/quotes/detail',
  CREATE_QUOTE: '/quotes/create',
  BOOKING_LINK: '/booking-link',
  MORE_PAYMENTS: '/more/payments',
  PAYMENTS: '/payments',
  MORE: '/more',
  MORE_HOME: '/more/home',
  ACCOUNT_SETTINGS: '/more/account',
  NOTIFICATIONS: '/more/notifications',
  NOTIFICATIONS_INBOX: '/notifications',
  CREATE_APPOINTMENT: '/create-appointment',
  UPGRADE_PAYWALL: '/upgrade',
  HELP: '/more/help',
  LEGAL: '/more/legal',
  /** Hosted legal pages on the Next.js site (opened from More tab). */
  PRIVACY_POLICY: '/privacy',
  TERMS_OF_SERVICE: '/terms',
};

/** Bottom tabs: order, labels, and Ionicons glyph names. */
export const MAIN_TAB_CONFIG = [
  { route: ROUTES.HOME, label: 'Home', icon: 'home-outline' },
  { route: ROUTES.BOOKINGS, label: 'Bookings', icon: 'calendar-outline' },
  { route: ROUTES.CUSTOMERS, label: 'Customers', icon: 'people-outline' },
  // { route: ROUTES.PAYMENTS, label: 'Payments', icon: 'card-outline' },
  { route: ROUTES.MORE, label: 'More', icon: 'ellipsis-horizontal' },
];
