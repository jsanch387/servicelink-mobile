/**
 * Single source of truth: stack/tab names, paths, and main tab bar config.
 * Import `ROUTES` / `PATHS` / `MAIN_TAB_CONFIG` — do not hardcode screen names in UI.
 */

export const ROUTES = {
  LOGIN: 'Login',
  SIGN_UP: 'SignUp',
  /** Stack screen that hosts the bottom tab navigator */
  MAIN_APP: 'MainApp',
  HOME: 'Home',
  BOOKINGS: 'Bookings',
  CUSTOMERS: 'Customers',
  PAYMENTS: 'Payments',
  PROFILE: 'Profile',
};

export const PATHS = {
  LOGIN: '/login',
  SIGN_UP: '/sign-up',
  HOME: '/',
  BOOKINGS: '/bookings',
  CUSTOMERS: '/customers',
  PAYMENTS: '/payments',
  PROFILE: '/profile',
};

/** Bottom tabs: order, labels, and Ionicons glyph names. */
export const MAIN_TAB_CONFIG = [
  { route: ROUTES.HOME, label: 'Home', icon: 'home-outline' },
  { route: ROUTES.BOOKINGS, label: 'Bookings', icon: 'calendar-outline' },
  { route: ROUTES.CUSTOMERS, label: 'Customers', icon: 'people-outline' },
  { route: ROUTES.PAYMENTS, label: 'Payments', icon: 'card-outline' },
  { route: ROUTES.PROFILE, label: 'More', icon: 'ellipsis-horizontal' },
];
