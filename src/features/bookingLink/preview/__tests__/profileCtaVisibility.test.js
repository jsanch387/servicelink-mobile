import {
  hasValidBookingLinkContactPhone,
  resolveBookingProfileCtaVisibility,
} from '../utils/profileCtaVisibility';

describe('hasValidBookingLinkContactPhone', () => {
  it('accepts valid US NANP numbers', () => {
    expect(hasValidBookingLinkContactPhone('(555) 234-5678')).toBe(true);
    expect(hasValidBookingLinkContactPhone('+15552345678')).toBe(true);
  });

  it('rejects empty or invalid numbers', () => {
    expect(hasValidBookingLinkContactPhone('')).toBe(false);
    expect(hasValidBookingLinkContactPhone('123')).toBe(false);
    expect(hasValidBookingLinkContactPhone(null)).toBe(false);
  });
});

describe('resolveBookingProfileCtaVisibility', () => {
  it('shows contact only when phone is valid and quotes are off', () => {
    expect(
      resolveBookingProfileCtaVisibility({
        phoneNumber: '(555) 234-5678',
        showRequestQuoteCta: false,
      }),
    ).toEqual({
      showContact: true,
      showRequestQuote: false,
      showCtaRow: true,
    });
  });

  it('shows quote only when accept quote is on and no phone', () => {
    expect(
      resolveBookingProfileCtaVisibility({
        phoneNumber: '',
        showRequestQuoteCta: true,
      }),
    ).toEqual({
      showContact: false,
      showRequestQuote: true,
      showCtaRow: true,
    });
  });

  it('shows both when phone and quote requests are enabled', () => {
    expect(
      resolveBookingProfileCtaVisibility({
        phoneNumber: '(555) 234-5678',
        showRequestQuoteCta: true,
      }),
    ).toEqual({
      showContact: true,
      showRequestQuote: true,
      showCtaRow: true,
    });
  });

  it('hides the row when neither CTA applies', () => {
    expect(
      resolveBookingProfileCtaVisibility({
        phoneNumber: '',
        showRequestQuoteCta: false,
      }),
    ).toEqual({
      showContact: false,
      showRequestQuote: false,
      showCtaRow: false,
    });
  });
});
