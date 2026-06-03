import { ROUTES } from '../../../routes/routes';
import { REVIEW_STAR_COLOR } from '../../reviews/constants';

/**
 * In-app feature announcements — one entry per shipped feature. Each `id` is shown at most once.
 * Add new entries to the end when you OTA; order controls the queue.
 *
 * @typedef {{
 *   id: string;
 *   badge?: string;
 *   icon?: import('@expo/vector-icons').IconProps['name'];
 *   iconColor?: string;
 *   title: string;
 *   bullets: string[];
 *   primaryLabel?: string;
 *   secondaryLabel?: string;
 *   cta?: { tab: string; screen?: string; params?: Record<string, unknown> };
 * }} WhatsNewAnnouncement
 */

/** @type {WhatsNewAnnouncement[]} */
export const APP_UPDATE_ANNOUNCEMENTS = [
  {
    id: 'reviews-inbox-v1',
    badge: "What's new",
    icon: 'star',
    iconColor: REVIEW_STAR_COLOR,
    title: 'Reviews',
    bullets: [
      'See new reviews from your booking link',
      'Read what customers said in one place',
      'Reply publicly so future clients know what to expect',
    ],
    primaryLabel: 'Take a look',
    secondaryLabel: 'Got it',
    cta: {
      tab: ROUTES.MORE,
      screen: ROUTES.REVIEWS,
    },
  },
];
