import {
  mapServiceAddonRowToEditorOption,
  normalizeAddonDurationHHmm,
} from '../utils/serviceAddonModel';

describe('serviceAddonModel', () => {
  it('maps addon rows into editor options', () => {
    const mapped = mapServiceAddonRowToEditorOption({
      id: 'addon-1',
      name: 'Pet hair',
      duration_minutes: 120,
      price_cents: 2500,
    });

    expect(mapped).toEqual({
      id: 'addon-1',
      name: 'Pet hair',
      durationLabel: '2 hrs',
      priceLabel: '$25',
      price: '25.00',
      durationHHmm: '02:00',
    });
  });

  it('supports empty/optional duration and fallback labels', () => {
    const mapped = mapServiceAddonRowToEditorOption({
      id: 'addon-2',
      title: 'Optional extra',
      duration_minutes: null,
      price_cents: 0,
    });

    expect(mapped.durationLabel).toBe('');
    expect(mapped.durationHHmm).toBe('');
    expect(mapped.priceLabel).toBe('$0');
  });

  it('normalizes addon duration inputs to half-hour HH:mm', () => {
    expect(normalizeAddonDurationHHmm('2:30')).toBe('02:30');
    expect(normalizeAddonDurationHHmm('9:15')).toBe('09:00');
    expect(normalizeAddonDurationHHmm('14:30')).toBe('10:30');
    expect(normalizeAddonDurationHHmm('')).toBe('');
  });
});
