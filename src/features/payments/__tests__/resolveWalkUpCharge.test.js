import { resolveWalkUpCharge } from '../create-payment/utils/resolveWalkUpCharge';

describe('resolveWalkUpCharge', () => {
  it('adds the shop rate on top of the typed price', () => {
    expect(
      resolveWalkUpCharge({ priceCents: 8500, taxEnabled: true, taxRateBps: 225 }),
    ).toMatchObject({
      priceCents: 8500,
      taxCents: 191,
      chargeCents: 8691,
      taxCaption: 'Tax (2.25%) $1.91',
      totalCaption: 'Total $86.91',
    });
  });

  it('charges the typed price when tax is off', () => {
    expect(
      resolveWalkUpCharge({ priceCents: 8500, taxEnabled: false, taxRateBps: 225 }),
    ).toMatchObject({
      taxCents: 0,
      chargeCents: 8500,
      taxCaption: null,
      totalCaption: null,
    });
  });
});
