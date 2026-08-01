import { APP_UPDATE_ANNOUNCEMENTS } from '../announcements';
import { ROUTES } from '../../../../routes/routes';

describe('APP_UPDATE_ANNOUNCEMENTS', () => {
  it('includes Revenue announcement with Payments CTA', () => {
    const entry = APP_UPDATE_ANNOUNCEMENTS.find((item) => item.id === 'revenue-v1');
    expect(entry).toMatchObject({
      title: 'See how much you make',
      illustration: 'revenue-chart',
      primaryLabel: 'View Revenue',
      secondaryLabel: 'Got it',
      cta: {
        tab: ROUTES.MORE,
        screen: ROUTES.MORE_PAYMENTS,
      },
    });
    expect(entry?.bullets?.length).toBeGreaterThan(0);
    expect(APP_UPDATE_ANNOUNCEMENTS.some((item) => item.id === 'marketing-v1')).toBe(false);
  });

  it('uses unique announcement ids', () => {
    const ids = APP_UPDATE_ANNOUNCEMENTS.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
