import {
  getBookingLinkDisplay,
  getBookingLinkHttpsUrl,
  normalizeBusinessSlug,
} from '../../home/utils/bookingLink';

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
