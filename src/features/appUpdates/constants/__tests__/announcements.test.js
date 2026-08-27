import { APP_UPDATE_ANNOUNCEMENTS } from '../announcements';
import { ROUTES } from '../../../../routes/routes';
import { PAYMENTS_SCREEN_TAB } from '../../../payments/constants/paymentsScreenTabs';

describe('APP_UPDATE_ANNOUNCEMENTS', () => {
  it('includes transactions announcement with Payments Transactions CTA', () => {
    const entry = APP_UPDATE_ANNOUNCEMENTS.find((item) => item.id === 'transactions-v1');
    expect(entry).toMatchObject({
      title: 'See your transactions',
      icon: 'receipt-outline',
      primaryLabel: 'View transactions',
      secondaryLabel: 'Got it',
      cta: {
        tab: ROUTES.MORE,
        screen: ROUTES.MORE_PAYMENTS,
        params: { initialTab: PAYMENTS_SCREEN_TAB.TRANSACTIONS },
      },
    });
    expect(entry?.bullets?.length).toBeGreaterThan(0);
    expect(APP_UPDATE_ANNOUNCEMENTS.some((item) => item.id === 'subscriptions-v1')).toBe(false);
    expect(APP_UPDATE_ANNOUNCEMENTS.some((item) => item.id === 'sms-v1')).toBe(false);
    expect(APP_UPDATE_ANNOUNCEMENTS.some((item) => item.id === 'revenue-v1')).toBe(false);
    expect(APP_UPDATE_ANNOUNCEMENTS.some((item) => item.id === 'marketing-v1')).toBe(false);
  });

  it('uses unique announcement ids', () => {
    const ids = APP_UPDATE_ANNOUNCEMENTS.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
