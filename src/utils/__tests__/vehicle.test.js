import {
  isOptionalBookingVehicleComplete,
  isOptionalVehicleComplete,
  normalizeBookingVehicle,
  sanitizeVehicleTextInput,
  sanitizeVehicleYearInput,
} from '../vehicle';

describe('vehicle utils', () => {
  it('sanitizes year to at most 4 digits', () => {
    expect(sanitizeVehicleYearInput('20a2b4')).toBe('2024');
    expect(sanitizeVehicleYearInput('20245')).toBe('2024');
  });

  it('keeps digits in make/model and caps length', () => {
    expect(sanitizeVehicleTextInput('F-150', 80)).toBe('F-150');
    expect(sanitizeVehicleTextInput('2500', 80)).toBe('2500');
    expect(sanitizeVehicleTextInput('x'.repeat(90), 80)).toHaveLength(80);
  });

  it('normalizeBookingVehicle trims and keeps Ram 2500', () => {
    expect(normalizeBookingVehicle({ year: '2015', make: ' Ram ', model: '2500' })).toEqual({
      year: '2015',
      make: 'Ram',
      model: '2500',
    });
  });

  it('treats Ram 2500 as a complete optional vehicle', () => {
    const now = new Date('2026-07-15T12:00:00Z');
    expect(isOptionalVehicleComplete({ year: '2015', make: 'Ram', model: '2500' }, now)).toBe(true);
    expect(
      isOptionalBookingVehicleComplete({ year: '2015', make: 'Ram', model: '2500' }, now),
    ).toBe(true);
    expect(isOptionalBookingVehicleComplete({ year: '', make: '', model: '' }, now)).toBe(true);
  });
});
