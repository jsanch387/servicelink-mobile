export const BOOKING_LINK_EDIT_GALLERY_COLUMNS = 3;
export const BOOKING_LINK_EDIT_GALLERY_GAP = 10;

/** Free plan: max portfolio images (existing + new) on the booking link profile. */
export const BOOKING_LINK_GALLERY_MAX_IMAGES_FREE = 4;

/** Pro: max portfolio images (existing + new) on the booking link profile. */
export const BOOKING_LINK_GALLERY_MAX_IMAGES_PRO = 8;

export function getBookingLinkGalleryMaxImages(hasProAccess) {
  return hasProAccess ? BOOKING_LINK_GALLERY_MAX_IMAGES_PRO : BOOKING_LINK_GALLERY_MAX_IMAGES_FREE;
}
