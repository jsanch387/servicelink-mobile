import { ROUTES } from '../../../routes/routes';

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
 *   illustration?: 'revenue-chart';
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
    id: 'revenue-v1',
    badge: "What's new",
    icon: 'cash-outline',
    iconLibrary: 'ionicons',
    illustration: 'revenue-chart',
    title: 'See how much you make',
    bullets: [
      'See totals from jobs you’ve finished and closed out',
      'Spot your best days, weeks, and months at a glance',
      'Compare this period to the last one so you know if you’re up',
    ],
    primaryLabel: 'View Revenue',
    secondaryLabel: 'Got it',
    cta: {
      tab: ROUTES.MORE,
      screen: ROUTES.MORE_PAYMENTS,
    },
  },
];
