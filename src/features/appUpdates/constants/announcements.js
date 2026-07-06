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
    id: 'tap-to-pay-iphone-v1',
    badge: "What's new",
    icon: 'contactless-payment',
    iconLibrary: 'material-community',
    iconColor: '#0a0a0a',
    iconBadgeVariant: 'light',
    title: 'Tap to Pay on iPhone',
    platforms: ['ios'],
    bullets: [
      'Accept contactless cards and Apple Pay when you complete a job',
      'Your iPhone is the payment terminal — no extra hardware',
      'Quick checkout at the end of every visit',
    ],
    primaryLabel: 'Take a look',
    secondaryLabel: 'Got it',
    cta: {
      tab: ROUTES.MORE,
      screen: ROUTES.MORE_PAYMENTS,
    },
  },
];
