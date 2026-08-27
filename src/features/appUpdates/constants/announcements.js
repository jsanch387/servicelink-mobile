import { ROUTES } from '../../../routes/routes';
import { PAYMENTS_SCREEN_TAB } from '../../payments/constants/paymentsScreenTabs';

/**
 * In-app feature announcements — one modal at a time. Each `id` is shown at most once per device.
 *
 * When you OTA a new announcement, **remove the previous entry** from this array. Retired modals
 * are not kept in the queue — users who never saw an old one simply won't see it; everyone else
 * gets only the latest feature. Replace the array contents (or swap the single entry), don't append.
 *
 * @typedef {{
 *   id: string;
 *   badge?: string;
 *   icon?: import('@expo/vector-icons').IconProps['name'];
 *   iconLibrary?: 'ionicons' | 'material-community';
 *   iconColor?: string;
 *   iconBadgeVariant?: 'default' | 'dark' | 'light';
 *   illustration?: 'revenue-chart' | 'sms-bubbles';
 *   title: string;
 *   bullets: string[];
 *   primaryLabel?: string;
 *   secondaryLabel?: string;
 *   cta?: { tab: string; screen?: string; params?: Record<string, unknown> };
 *   platforms?: Array<'ios' | 'android'>;
 * }} WhatsNewAnnouncement
 */

/** @type {WhatsNewAnnouncement[]} */
export const APP_UPDATE_ANNOUNCEMENTS = [
  {
    id: 'transactions-v1',
    badge: "What's new",
    icon: 'receipt-outline',
    title: 'See your transactions',
    bullets: [
      'Every payment, payout, and refund in one list',
      'Check what’s available and what’s still on the way',
      'Open Payments anytime to review your money',
    ],
    primaryLabel: 'View transactions',
    secondaryLabel: 'Got it',
    cta: {
      tab: ROUTES.MORE,
      screen: ROUTES.MORE_PAYMENTS,
      params: { initialTab: PAYMENTS_SCREEN_TAB.TRANSACTIONS },
    },
  },
];
