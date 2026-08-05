import { APP_UPDATE_ANNOUNCEMENTS } from '../announcements';
import { ROUTES } from '../../../../routes/routes';

describe('APP_UPDATE_ANNOUNCEMENTS', () => {
  it('includes customer SMS announcement with Messages sent CTA', () => {
    const entry = APP_UPDATE_ANNOUNCEMENTS.find((item) => item.id === 'sms-v1');
    expect(entry).toMatchObject({
      title: 'We text your customers for you',
      illustration: 'sms-bubbles',
      primaryLabel: 'View messages',
      secondaryLabel: 'Got it',
      cta: {
        tab: ROUTES.MORE,
        screen: ROUTES.SENT_TEXTS,
      },
    });
    expect(entry?.bullets?.length).toBeGreaterThan(0);
    expect(APP_UPDATE_ANNOUNCEMENTS.some((item) => item.id === 'revenue-v1')).toBe(false);
    expect(APP_UPDATE_ANNOUNCEMENTS.some((item) => item.id === 'marketing-v1')).toBe(false);
  });

  it('uses unique announcement ids', () => {
    const ids = APP_UPDATE_ANNOUNCEMENTS.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
