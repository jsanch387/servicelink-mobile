import { buildServiceArea, splitServiceAreaCityState } from '../utils/serviceArea';

describe('splitServiceAreaCityState', () => {
  it('returns empty tuple for blank input', () => {
    expect(splitServiceAreaCityState(null)).toEqual(['', '']);
    expect(splitServiceAreaCityState('   ')).toEqual(['', '']);
  });

  it('splits city and state', () => {
    expect(splitServiceAreaCityState('Austin, TX')).toEqual(['Austin', 'TX']);
    expect(splitServiceAreaCityState('San Antonio, TX')).toEqual(['San Antonio', 'TX']);
  });

  it('uses whole string as city when no comma', () => {
    expect(splitServiceAreaCityState('Dallas')).toEqual(['Dallas', '']);
  });
});

describe('buildServiceArea', () => {
  it('joins city and state', () => {
    expect(buildServiceArea('Austin', 'tx')).toBe('Austin, TX');
  });

  it('returns city only when state missing', () => {
    expect(buildServiceArea('Houston', '')).toBe('Houston');
  });

  it('returns null when both empty', () => {
    expect(buildServiceArea('', '')).toBe(null);
  });
});
