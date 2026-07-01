import { BOOKING_LINK_EDIT_TAB_BOOKING } from '../edit/constants/bookingLinkEditTabs';

/** Route params for {@link ../screens/BookingLinkScreen}. */
export const BOOKING_LINK_ROUTE_PARAMS = {
  OPEN_EDIT: 'openEdit',
  EDIT_TAB: 'editTab',
};

/** Deep link from feature announcements → edit mode on the Booking tab. */
export const BOOKING_LINK_ANNOUNCEMENT_EDIT_PARAMS = {
  [BOOKING_LINK_ROUTE_PARAMS.OPEN_EDIT]: true,
  [BOOKING_LINK_ROUTE_PARAMS.EDIT_TAB]: BOOKING_LINK_EDIT_TAB_BOOKING,
};
