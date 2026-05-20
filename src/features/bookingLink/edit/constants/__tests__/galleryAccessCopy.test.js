import {
  BOOKING_LINK_GALLERY_MAX_IMAGES_FREE,
  BOOKING_LINK_GALLERY_MAX_IMAGES_PRO,
  bookingLinkGalleryAccessCopy,
} from '../galleryAccessCopy';

describe('bookingLinkGalleryAccessCopy', () => {
  it('uses 4-image free limit in copy', () => {
    const copy = bookingLinkGalleryAccessCopy(BOOKING_LINK_GALLERY_MAX_IMAGES_FREE);
    expect(copy.inlineHint).toContain('4');
    expect(copy.alertMessage).toContain('4');
  });

  it('avoids upgrade and Pro product language', () => {
    const copy = bookingLinkGalleryAccessCopy();
    const blob = Object.values(copy).join(' ');
    expect(blob).not.toMatch(/upgrade/i);
    expect(blob).not.toMatch(/\bpro\b/i);
    expect(copy.inlineHintAction).toBe('Sign in on the web');
  });
});

describe('gallery image limits', () => {
  it('free tier is 4 and expanded access is 8', () => {
    expect(BOOKING_LINK_GALLERY_MAX_IMAGES_FREE).toBe(4);
    expect(BOOKING_LINK_GALLERY_MAX_IMAGES_PRO).toBe(8);
  });
});
