import { resolveBookingDiscount } from '../utils/resolveBookingDiscount';

describe('resolveBookingDiscount', () => {
  it('returns null when discount_cents is missing or zero', () => {
    expect(resolveBookingDiscount(null)).toBeNull();
    expect(resolveBookingDiscount({})).toBeNull();
    expect(resolveBookingDiscount({ discount_cents: 0 })).toBeNull();
  });

  it('reads snapshot fields and falls back to source label', () => {
    expect(
      resolveBookingDiscount({
        discount_cents: 1500,
        discount_source: 'sale',
        discount_sale_id: 'sale-1',
      }),
    ).toEqual({
      discountCents: 1500,
      discountDollars: 15,
      label: 'Sale',
      source: 'sale',
      saleId: 'sale-1',
      promoCodeId: null,
    });

    expect(
      resolveBookingDiscount({
        discount_cents: 1000,
        discount_source: 'promo',
        discount_label: 'SAVE10',
        discount_promo_code_id: 'promo-1',
      }),
    ).toEqual({
      discountCents: 1000,
      discountDollars: 10,
      label: 'SAVE10',
      source: 'promo',
      saleId: null,
      promoCodeId: 'promo-1',
    });
  });
});
