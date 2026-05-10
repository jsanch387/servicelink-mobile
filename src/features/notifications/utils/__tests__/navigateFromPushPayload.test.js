import { ROUTES } from '../../../../routes/routes';
import { navigateFromPushPayload } from '../navigateFromPushPayload';

describe('navigateFromPushPayload', () => {
  it('maps snake_case keys to booking details', () => {
    const navigation = { navigate: jest.fn() };
    navigateFromPushPayload(navigation, {
      reference_type: 'booking',
      reference_id: 'push-bid-1',
    });
    expect(navigation.navigate).toHaveBeenCalledWith(
      ROUTES.MAIN_APP,
      expect.objectContaining({
        params: expect.objectContaining({
          params: { bookingId: 'push-bid-1' },
        }),
      }),
    );
  });

  it('maps camelCase keys', () => {
    const navigation = { navigate: jest.fn() };
    navigateFromPushPayload(navigation, {
      referenceType: 'quote',
      referenceId: 'q-99',
    });
    expect(navigation.navigate).toHaveBeenCalledWith(ROUTES.MAIN_APP, {
      screen: ROUTES.MORE,
      params: {
        screen: ROUTES.QUOTE_DETAIL,
        params: { quoteId: 'q-99' },
      },
    });
  });

  it('no-ops when data is null or undefined', () => {
    const navigation = { navigate: jest.fn() };
    navigateFromPushPayload(navigation, null);
    navigateFromPushPayload(navigation, undefined);
    expect(navigation.navigate).not.toHaveBeenCalled();
  });

  it('falls back to bookings list when payload has no routing keys', () => {
    const navigation = { navigate: jest.fn() };
    navigateFromPushPayload(navigation, {});
    expect(navigation.navigate).toHaveBeenCalledWith(ROUTES.MAIN_APP, {
      screen: ROUTES.BOOKINGS,
      params: { screen: ROUTES.BOOKINGS_LIST },
    });
  });
});
