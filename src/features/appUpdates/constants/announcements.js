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
    id: 'marketing-v1',
    badge: "What's new",
    icon: 'megaphone-outline',
    iconLibrary: 'ionicons',
    title: 'Marketing',
    bullets: [
      'Create promo codes customers can enter when they book',
      'Run sales that automatically discount qualifying appointments',
      'Turn offers on or off anytime from More → Marketing',
    ],
    primaryLabel: 'Try it out',
    secondaryLabel: 'Got it',
    cta: {
      tab: ROUTES.MORE,
      screen: ROUTES.MARKETING,
    },
  },
];
