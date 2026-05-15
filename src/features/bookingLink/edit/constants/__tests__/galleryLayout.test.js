import {
  BOOKING_LINK_GALLERY_MAX_IMAGES_FREE,
  BOOKING_LINK_GALLERY_MAX_IMAGES_PRO,
  getBookingLinkGalleryMaxImages,
} from '../galleryLayout';

describe('getBookingLinkGalleryMaxImages', () => {
  it('returns free tier max when not Pro', () => {
    expect(getBookingLinkGalleryMaxImages(false)).toBe(BOOKING_LINK_GALLERY_MAX_IMAGES_FREE);
    expect(getBookingLinkGalleryMaxImages(undefined)).toBe(BOOKING_LINK_GALLERY_MAX_IMAGES_FREE);
  });

  it('returns Pro max when Pro', () => {
    expect(getBookingLinkGalleryMaxImages(true)).toBe(BOOKING_LINK_GALLERY_MAX_IMAGES_PRO);
  });
});
