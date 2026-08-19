import { APP_UPDATE_ANNOUNCEMENTS } from '../announcements';
import { ROUTES } from '../../../../routes/routes';

describe('APP_UPDATE_ANNOUNCEMENTS', () => {
  it('includes subscriptions announcement with Subscriptions CTA', () => {
    const entry = APP_UPDATE_ANNOUNCEMENTS.find((item) => item.id === 'subscriptions-v1');
    expect(entry).toMatchObject({
      title: 'Subscriptions for recurring work',
      icon: 'layers-outline',
      primaryLabel: 'View subscriptions',
      secondaryLabel: 'Got it',
      cta: {
        tab: ROUTES.MORE,
        screen: ROUTES.SUBSCRIPTIONS,
      },
    });
    expect(entry?.bullets?.length).toBeGreaterThan(0);
    expect(APP_UPDATE_ANNOUNCEMENTS.some((item) => item.id === 'sms-v1')).toBe(false);
    expect(APP_UPDATE_ANNOUNCEMENTS.some((item) => item.id === 'revenue-v1')).toBe(false);
    expect(APP_UPDATE_ANNOUNCEMENTS.some((item) => item.id === 'marketing-v1')).toBe(false);
  });

  it('uses unique announcement ids', () => {
    const ids = APP_UPDATE_ANNOUNCEMENTS.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
