import { buildReviewTaxPreview } from '../utils/reviewTaxPreview';
import { formatUsdFromCents } from '../utils/priceLabelMath';

describe('buildReviewTaxPreview', () => {
  it('previews tax on an $85 job at 2.25%', () => {
    expect(
      buildReviewTaxPreview({
        priceAfterDiscountCents: 8500,
        taxEnabled: true,
        taxRateBps: 225,
      }),
    ).toEqual({
      priceAfterDiscountCents: 8500,
      taxCents: 191,
      taxRateBps: 225,
      customerPaysCents: 8691,
    });
  });

  it('skips tax when the shop switch is off', () => {
    expect(
      buildReviewTaxPreview({
        priceAfterDiscountCents: 8500,
        taxEnabled: false,
        taxRateBps: 225,
      }).taxCents,
    ).toBe(0);
  });

  it('does not tax a covered membership visit', () => {
    const preview = buildReviewTaxPreview({
      isMembershipVisit: true,
      priceAfterDiscountCents: 8500,
      taxEnabled: true,
      taxRateBps: 225,
    });
    expect(preview).toEqual({
      priceAfterDiscountCents: 0,
      taxCents: 0,
      taxRateBps: null,
      customerPaysCents: 0,
    });
  });
});

describe('formatUsdFromCents', () => {
  it('keeps cents on the tax line', () => {
    expect(formatUsdFromCents(191, { forceCents: true })).toMatch(/1\.91/);
    expect(formatUsdFromCents(8691, { forceCents: true })).toMatch(/86\.91/);
    expect(formatUsdFromCents(8500)).toMatch(/\$85$/);
  });
});
