/** Stable QR styling so web/mobile look consistent when they share these values. */
export const BOOKING_LINK_QR = Object.freeze({
  /** On-screen QR module size (px). */
  displaySize: 296,
  /** Padding around the QR inside the white capture card (px). */
  displayPadding: 24,
  /** Capture export size (px) — high-res for flyers / save. */
  captureSize: 1024,
  backgroundColor: '#ffffff',
  foregroundColor: '#000000',
  /** Error correction — M is a good print/scan balance without a logo. */
  ecl: 'M',
});
