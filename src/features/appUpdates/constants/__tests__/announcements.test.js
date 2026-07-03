import { APP_UPDATE_ANNOUNCEMENTS } from '../announcements';
import { ROUTES } from '../../../../routes/routes';
import { BOOKING_LINK_ROUTE_PARAMS } from '../../../bookingLink/constants/bookingLinkRouteParams';

describe('APP_UPDATE_ANNOUNCEMENTS', () => {
  it('includes mobile or shop announcement with booking link edit CTA', () => {
    const entry = APP_UPDATE_ANNOUNCEMENTS.find((item) => item.id === 'booking-mobile-shop-v1');
    expect(entry).toMatchObject({
      title: 'Shop, mobile, or both?',
      primaryLabel: 'Set it up',
      secondaryLabel: 'Got it',
      cta: {
        tab: ROUTES.MORE,
        screen: ROUTES.BOOKING_LINK,
        params: {
          [BOOKING_LINK_ROUTE_PARAMS.OPEN_EDIT]: true,
          [BOOKING_LINK_ROUTE_PARAMS.EDIT_TAB]: 'booking',
        },
      },
    });
    expect(entry?.bullets?.length).toBeGreaterThan(0);
  });

  it('uses unique announcement ids', () => {
    const ids = APP_UPDATE_ANNOUNCEMENTS.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
