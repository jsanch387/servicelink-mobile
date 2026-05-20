import {
  BOOKING_LINK_GALLERY_MAX_IMAGES_FREE,
  BOOKING_LINK_GALLERY_MAX_IMAGES_PRO,
} from './galleryLayout';

/**
 * App Store–safe copy for gallery limits (no "Upgrade" / Pro product language).
 *
 * @param {number} [freeLimit]
 */
export function bookingLinkGalleryAccessCopy(freeLimit = BOOKING_LINK_GALLERY_MAX_IMAGES_FREE) {
  return {
    alertTitle: 'Gallery limit reached',
    alertMessage: `You've reached the maximum of ${freeLimit} gallery photos on your current access. To add more, sign in on the ServiceLink website with the same email you use in this app.`,
    inlineHint: `You've used all ${freeLimit} gallery photos on your current access.`,
    inlineHintAction: 'Sign in on the web',
    addFullSubtitle: `You've used all ${freeLimit} photos. Sign in on the web to add more, or remove one to replace.`,
  };
}

export { BOOKING_LINK_GALLERY_MAX_IMAGES_FREE, BOOKING_LINK_GALLERY_MAX_IMAGES_PRO };
