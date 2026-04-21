import {
  BOOKING_LINK_HOST,
  getBookingLinkDisplay,
  getBookingLinkHttpsUrl,
  normalizeBusinessSlug,
} from '../utils/bookingLink';

describe('normalizeBusinessSlug', () => {
  it('returns empty for nullish', () => {
    expect(normalizeBusinessSlug(null)).toBe('');
    expect(normalizeBusinessSlug(undefined)).toBe('');
  });

  it('trims and strips leading/trailing slashes', () => {
    expect(normalizeBusinessSlug('  /my-shop/  ')).toBe('my-shop');
  });
});

describe('getBookingLinkDisplay', () => {
  it('returns empty when slug empty', () => {
    expect(getBookingLinkDisplay('')).toBe('');
    expect(getBookingLinkDisplay('   ')).toBe('');
  });

  it('returns host/slug', () => {
    expect(getBookingLinkDisplay('acme')).toBe(`${BOOKING_LINK_HOST}/acme`);
  });
});

describe('getBookingLinkHttpsUrl', () => {
  it('returns https URL', () => {
    expect(getBookingLinkHttpsUrl('acme')).toBe(`https://${BOOKING_LINK_HOST}/acme`);
  });
});
