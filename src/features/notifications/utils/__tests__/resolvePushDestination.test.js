import { ROUTES } from '../../../../routes/routes';
import {
  BOOKING_LINK_ANNOUNCEMENT_EDIT_PARAMS,
  BOOKING_LINK_ROUTE_PARAMS,
} from '../../../bookingLink/constants/bookingLinkRouteParams';
import { BOOKING_LINK_EDIT_TAB_DETAILS } from '../../../bookingLink/edit/constants/bookingLinkEditTabs';
import { resolvePushDestination } from '../resolvePushDestination';

describe('resolvePushDestination', () => {
  it('maps screen slugs for broadcast pushes', () => {
    expect(resolvePushDestination({ referenceType: 'screen', referenceId: 'home' })).toEqual({
      kind: 'main_app_tab',
      tab: ROUTES.HOME,
    });
    expect(resolvePushDestination({ referenceType: 'screen', referenceId: 'payments' })).toEqual({
      kind: 'main_app_tab',
      tab: ROUTES.MORE,
      stackScreen: ROUTES.MORE_PAYMENTS,
    });
    expect(resolvePushDestination({ referenceType: 'screen', referenceId: 'maintenance' })).toEqual(
      {
        kind: 'main_app_tab',
        tab: ROUTES.MORE,
        stackScreen: ROUTES.MAINTENANCE,
      },
    );
  });

  it('treats announcement as an alias for screen', () => {
    expect(
      resolvePushDestination({ referenceType: 'announcement', referenceId: 'quotes' }),
    ).toEqual({
      kind: 'main_app_tab',
      tab: ROUTES.MORE,
      stackScreen: ROUTES.QUOTES,
    });
  });

  it('opens booking link edit for booking_link slug (feature broadcasts)', () => {
    expect(
      resolvePushDestination({ referenceType: 'screen', referenceId: 'booking_link' }),
    ).toEqual({
      kind: 'main_app_tab',
      tab: ROUTES.MORE,
      stackScreen: ROUTES.BOOKING_LINK,
      stackParams: BOOKING_LINK_ANNOUNCEMENT_EDIT_PARAMS,
    });
  });

  it('opens business profile edit on booking link details tab', () => {
    expect(resolvePushDestination({ referenceType: 'screen', referenceId: 'profile' })).toEqual({
      kind: 'main_app_tab',
      tab: ROUTES.MORE,
      stackScreen: ROUTES.BOOKING_LINK,
      stackParams: {
        [BOOKING_LINK_ROUTE_PARAMS.OPEN_EDIT]: true,
        [BOOKING_LINK_ROUTE_PARAMS.EDIT_TAB]: BOOKING_LINK_EDIT_TAB_DETAILS,
      },
    });
  });

  it('falls back to home for unknown screen slugs', () => {
    expect(
      resolvePushDestination({ referenceType: 'screen', referenceId: 'unknown-screen' }),
    ).toEqual({ kind: 'home' });
  });

  it('maps booking_edit to root edit flow', () => {
    expect(
      resolvePushDestination({ referenceType: 'booking_edit', referenceId: 'bid-edit-1' }),
    ).toEqual({
      kind: 'root_stack',
      screen: ROUTES.EDIT_BOOKING,
      params: { bookingId: 'bid-edit-1' },
    });
  });

  it('maps booking and booking_request to booking details', () => {
    const expected = {
      kind: 'main_app_tab',
      tab: ROUTES.BOOKINGS,
      stackScreen: ROUTES.BOOKING_DETAILS,
      stackParams: { bookingId: 'bid-1' },
    };
    expect(resolvePushDestination({ referenceType: 'booking', referenceId: 'bid-1' })).toEqual(
      expected,
    );
    expect(
      resolvePushDestination({ referenceType: 'booking_request', referenceId: 'bid-1' }),
    ).toEqual(expected);
  });

  it('maps quote_edit to create quote flow', () => {
    expect(
      resolvePushDestination({ referenceType: 'quote_edit', referenceId: 'q-edit-1' }),
    ).toEqual({
      kind: 'root_stack',
      screen: ROUTES.CREATE_QUOTE,
      params: { quoteRequestId: 'q-edit-1' },
    });
  });

  it('maps customer to customer details', () => {
    expect(resolvePushDestination({ referenceType: 'customer', referenceId: 'cust-1' })).toEqual({
      kind: 'main_app_tab',
      tab: ROUTES.CUSTOMERS,
      stackScreen: ROUTES.CUSTOMER_DETAILS,
      stackParams: { customerId: 'cust-1' },
    });
  });

  it('returns noop when routing keys are empty', () => {
    expect(resolvePushDestination({ referenceType: '', referenceId: '' })).toEqual({
      kind: 'noop',
    });
  });

  it('falls back to home for unknown reference types', () => {
    expect(resolvePushDestination({ referenceType: 'alien', referenceId: 'x' })).toEqual({
      kind: 'home',
    });
  });
});
