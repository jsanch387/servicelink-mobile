import { ROUTES } from '../../../routes/routes';
import { BOOKING_LINK_ANNOUNCEMENT_EDIT_PARAMS } from '../../bookingLink/constants/bookingLinkRouteParams';

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
    id: 'booking-mobile-shop-v1',
    badge: "What's new",
    icon: 'storefront-outline',
    title: 'Mobile or shop',
    bullets: [
      'Choose mobile, shop, or both on your booking link',
      'Add your shop address when clients come to you',
      'Set where you work so customers know how to book',
    ],
    primaryLabel: 'Take a look',
    secondaryLabel: 'Got it',
    cta: {
      tab: ROUTES.MORE,
      screen: ROUTES.BOOKING_LINK,
      params: BOOKING_LINK_ANNOUNCEMENT_EDIT_PARAMS,
    },
  },
];
