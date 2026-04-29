import {
  getBookingLinkDisplay,
  getBookingLinkHttpsUrl,
  normalizeBusinessSlug,
} from '../../home/utils/bookingLink';
import {
  getSubscriptionAccessLine,
  getSubscriptionHeaderBadge,
  getSubscriptionPlanLabel,
  getSubscriptionPriceDisplay,
  hasProAccessFromProfile,
} from './subscriptionPresentation';

/**
 * @param {Record<string, unknown> | null | undefined} ownerProfile
 */
export function buildSubscriptionCardModel(ownerProfile) {
  return {
    accessLine: getSubscriptionAccessLine(ownerProfile),
    headerBadge: getSubscriptionHeaderBadge(ownerProfile),
    planLabel: getSubscriptionPlanLabel(ownerProfile),
    priceDisplay: getSubscriptionPriceDisplay(ownerProfile),
    showProCrown: hasProAccessFromProfile(ownerProfile),
  };
}

/**
 * @param {string | null | undefined} rawSlug
 */
export function buildBookingLinkCardModel(rawSlug) {
  const slug = normalizeBusinessSlug(rawSlug);
  const hasSlug = Boolean(slug);
  return {
    displayLink: getBookingLinkDisplay(slug),
    hasSlug,
    httpsUrl: getBookingLinkHttpsUrl(slug),
    slug,
  };
}
