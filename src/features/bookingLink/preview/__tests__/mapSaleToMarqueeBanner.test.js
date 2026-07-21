import { DEPOSIT_AMOUNT_MODE } from '../../../payments/constants/depositAmount';
import {
  formatSaleDiscountHighlight,
  mapSaleToMarqueeBanner,
} from '../utils/mapSaleToMarqueeBanner';

describe('mapSaleToMarqueeBanner', () => {
  it('maps a percentage sale', () => {
    expect(
      mapSaleToMarqueeBanner({
        name: 'Spring Sale',
        discountMode: DEPOSIT_AMOUNT_MODE.PERCENTAGE,
        discountAmount: '10',
      }),
    ).toEqual({
      name: 'Spring Sale',
      discountType: 'percentage',
      discountValue: 10,
    });
  });

  it('maps a fixed sale', () => {
    expect(
      mapSaleToMarqueeBanner({
        name: '  Flash  ',
        discountMode: DEPOSIT_AMOUNT_MODE.FIXED,
        discountAmount: '25',
      }),
    ).toEqual({
      name: 'Flash',
      discountType: 'fixed',
      discountValue: 25,
    });
  });

  it('returns null without a usable discount', () => {
    expect(mapSaleToMarqueeBanner(null)).toBeNull();
    expect(
      mapSaleToMarqueeBanner({
        name: 'Sale',
        discountMode: DEPOSIT_AMOUNT_MODE.PERCENTAGE,
        discountAmount: '0',
      }),
    ).toBeNull();
  });
});

describe('formatSaleDiscountHighlight', () => {
  it('formats percentage and fixed values', () => {
    expect(formatSaleDiscountHighlight('percentage', 10)).toBe('10%');
    expect(formatSaleDiscountHighlight('fixed', 25)).toBe('$25');
    expect(formatSaleDiscountHighlight('fixed', 12.5)).toBe('$12.5');
  });
});
