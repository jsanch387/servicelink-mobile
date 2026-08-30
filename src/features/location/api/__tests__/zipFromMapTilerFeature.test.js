import { zipFromMapTilerFeature } from '../mapTilerGeocoding';

describe('zipFromMapTilerFeature', () => {
  it('reads postal_code from context', () => {
    expect(
      zipFromMapTilerFeature({
        context: [{ id: 'postal_code.1', text: '78701', place_type: ['postal_code'] }],
      }),
    ).toBe('78701');
  });

  it('reads MapTiler postcode ids', () => {
    expect(
      zipFromMapTilerFeature({
        context: [{ id: 'postcode.78704' }],
      }),
    ).toBe('78704');
  });

  it('reads properties.postcode', () => {
    expect(
      zipFromMapTilerFeature({
        properties: { postcode: '90001' },
      }),
    ).toBe('90001');
  });

  it('falls back to place_name', () => {
    expect(
      zipFromMapTilerFeature({
        place_name: '123 Main St, Austin, Texas 78702, United States',
      }),
    ).toBe('78702');
  });

  it('returns empty when no ZIP is present', () => {
    expect(zipFromMapTilerFeature({ place_name: 'Austin, Texas, United States' })).toBe('');
  });
});
