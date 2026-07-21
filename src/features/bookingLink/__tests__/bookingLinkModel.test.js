import { DEPOSIT_AMOUNT_MODE } from '../../payments/constants/depositAmount';
import { getServiceDescriptionCopy, mapServicesForCards } from '../utils/bookingLinkModel';

describe('mapServicesForCards', () => {
  it('maps API rows to card props with defaults', () => {
    const rows = [
      {
        id: 's1',
        name: 'Wash',
        description: '  Full detail  ',
        price_cents: 5000,
        duration_minutes: 90,
        category_id: 'cat-cars',
      },
    ];
    expect(mapServicesForCards(rows)).toEqual([
      expect.objectContaining({
        id: 's1',
        title: 'Wash',
        description: 'Full detail',
        price: '$50',
        duration: '1 hr 30 min',
        isLongDescription: false,
        categoryId: 'cat-cars',
      }),
    ]);
    expect(mapServicesForCards(rows)[0].compareAtPrice).toBeUndefined();
  });

  it('applies an active sale with compare-at and sale prices', () => {
    const sale = {
      isEnabled: true,
      discountMode: DEPOSIT_AMOUNT_MODE.PERCENTAGE,
      discountAmount: '10',
      startDateYyyyMmDd: '2020-01-01',
      endDateYyyyMmDd: '2099-12-31',
    };
    const [card] = mapServicesForCards(
      [{ id: 's1', name: 'Signature Shinee', price_cents: 17500 }],
      { activeSale: sale },
    );
    expect(card).toEqual(
      expect.objectContaining({
        price: '$158',
        compareAtPrice: '$175',
      }),
    );
  });

  it('marks long descriptions', () => {
    const long = 'x'.repeat(101);
    const [card] = mapServicesForCards([{ name: 'X', description: long, price_cents: 0 }]);
    expect(card.isLongDescription).toBe(true);
    expect(getServiceDescriptionCopy(card, false).endsWith('...')).toBe(true);
    expect(getServiceDescriptionCopy(card, true)).toBe(card.description);
  });

  it('handles empty list', () => {
    expect(mapServicesForCards(null)).toEqual([]);
    expect(mapServicesForCards(undefined)).toEqual([]);
  });
});

describe('getServiceDescriptionCopy', () => {
  it('returns full text when short', () => {
    const service = { description: 'Short', isLongDescription: false };
    expect(getServiceDescriptionCopy(service, false)).toBe('Short');
  });
});
