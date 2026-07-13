import { APP_UPDATE_ANNOUNCEMENTS } from '../announcements';
import { ROUTES } from '../../../../routes/routes';

describe('APP_UPDATE_ANNOUNCEMENTS', () => {
  it('includes Marketing announcement with Marketing screen CTA', () => {
    const entry = APP_UPDATE_ANNOUNCEMENTS.find((item) => item.id === 'marketing-v1');
    expect(entry).toMatchObject({
      title: 'Marketing',
      primaryLabel: 'Try it out',
      secondaryLabel: 'Got it',
      cta: {
        tab: ROUTES.MORE,
        screen: ROUTES.MARKETING,
      },
    });
    expect(entry?.bullets?.length).toBeGreaterThan(0);
    expect(APP_UPDATE_ANNOUNCEMENTS.some((item) => item.id === 'tap-to-pay-iphone-v1')).toBe(false);
  });

  it('uses unique announcement ids', () => {
    const ids = APP_UPDATE_ANNOUNCEMENTS.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
