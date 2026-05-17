import { FREE_TIER_BOOKINGS_LIMIT } from '../../bookings/constants';
import {
  BOOKING_LINK_GALLERY_MAX_IMAGES_FREE,
  BOOKING_LINK_GALLERY_MAX_IMAGES_PRO,
} from '../../bookingLink/edit/constants/galleryLayout';
import { FREE_TIER_MAX_SERVICES } from '../../services/constants/freeTierLimits';

export const PRO_PLAN_DISPLAY = {
  primary: '$10',
  period: '/month',
  compareAt: '$15/mo',
  ribbon: 'Save $5/month on Pro',
};

/**
 * @typedef {{ label: string; free: string; pro: string; freeUnavailable?: boolean }} PlanComparisonRow
 */

/** @type {PlanComparisonRow[]} */
export const PLAN_COMPARISON_FEATURES = [
  {
    label: 'Bookings',
    free: `Up to ${FREE_TIER_BOOKINGS_LIMIT} appointments`,
    pro: 'Unlimited bookings',
  },
  {
    label: 'Services',
    free: `Up to ${FREE_TIER_MAX_SERVICES} services`,
    pro: 'Unlimited services',
  },
  {
    label: 'Booking link gallery',
    free: `${BOOKING_LINK_GALLERY_MAX_IMAGES_FREE} Gallery images`,
    pro: `${BOOKING_LINK_GALLERY_MAX_IMAGES_PRO} Gallery images`,
  },
  {
    label: 'Quote requests',
    free: 'Not available',
    pro: 'Accept quote requests',
    freeUnavailable: true,
  },
  {
    label: 'Service pricing',
    free: 'Single price per service',
    pro: 'Multiple prices',
  },
  {
    label: 'Payments',
    free: 'Not available',
    pro: 'Accept payments & deposits',
    freeUnavailable: true,
  },
  {
    label: 'Verified badge',
    free: 'Not available',
    pro: 'Verified badge on your profile',
    freeUnavailable: true,
  },
];
