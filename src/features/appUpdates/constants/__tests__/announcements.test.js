import { APP_UPDATE_ANNOUNCEMENTS } from '../announcements';
import { ROUTES } from '../../../../routes/routes';

describe('APP_UPDATE_ANNOUNCEMENTS', () => {
  it('includes Tap to Pay on iPhone announcement with Payments CTA', () => {
    const entry = APP_UPDATE_ANNOUNCEMENTS.find((item) => item.id === 'tap-to-pay-iphone-v1');
    expect(entry).toMatchObject({
      title: 'Tap to Pay on iPhone',
      primaryLabel: 'Take a look',
      secondaryLabel: 'Got it',
      platforms: ['ios'],
      cta: {
        tab: ROUTES.MORE,
        screen: ROUTES.MORE_PAYMENTS,
      },
    });
    expect(entry?.bullets?.length).toBeGreaterThan(0);
  });

  it('uses unique announcement ids', () => {
    const ids = APP_UPDATE_ANNOUNCEMENTS.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
