import {
  buildQuoteTaxPreview,
  quotePriceTextToCents,
  quoteUsdToCents,
} from '../utils/quoteTaxPreview';

describe('quoteTaxPreview', () => {
  it('turns a typed price into cents', () => {
    expect(quotePriceTextToCents('85')).toBe(8500);
    expect(quotePriceTextToCents('$85.00')).toBe(8500);
    expect(quotePriceTextToCents('')).toBe(0);
    expect(quoteUsdToCents(85)).toBe(8500);
  });

  it('previews $85 at 2.25% as $1.91 tax and $86.91 due', () => {
    expect(buildQuoteTaxPreview({ priceCents: 8500, taxEnabled: true, taxRateBps: 225 })).toEqual({
      priceCents: 8500,
      taxCents: 191,
      taxRateBps: 225,
      customerPaysCents: 8691,
      label: 'Tax (2.25%)',
    });
  });

  it('adds no tax when the shop switch is off', () => {
    expect(
      buildQuoteTaxPreview({ priceCents: 8500, taxEnabled: false, taxRateBps: 225 }),
    ).toMatchObject({ taxCents: 0, customerPaysCents: 8500, taxRateBps: null });
  });

  it('adds no tax on a $0 price', () => {
    expect(
      buildQuoteTaxPreview({ priceCents: 0, taxEnabled: true, taxRateBps: 225 }).taxCents,
    ).toBe(0);
  });
});
