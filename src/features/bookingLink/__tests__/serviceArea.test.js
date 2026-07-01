import {
  buildServiceArea,
  parseServiceAreaCityState,
  splitServiceAreaCityState,
} from '../utils/serviceArea';

describe('parseServiceAreaCityState', () => {
  it('returns empty fields for blank input', () => {
    expect(parseServiceAreaCityState(null)).toEqual({ city: '', state: '' });
    expect(parseServiceAreaCityState('   ')).toEqual({ city: '', state: '' });
  });

  it('splits city and state', () => {
    expect(parseServiceAreaCityState('Austin, TX')).toEqual({
      city: 'Austin',
      state: 'TX',
    });
  });

  it('strips legacy zip from state segment', () => {
    expect(parseServiceAreaCityState('Austin, TX 78701')).toEqual({
      city: 'Austin',
      state: 'TX',
    });
  });

  it('uses whole string as city when no comma', () => {
    expect(parseServiceAreaCityState('Dallas')).toEqual({ city: 'Dallas', state: '' });
  });
});

describe('splitServiceAreaCityState', () => {
  it('returns tuple', () => {
    expect(splitServiceAreaCityState('Austin, TX')).toEqual(['Austin', 'TX']);
  });
});

describe('buildServiceArea', () => {
  it('joins city and state', () => {
    expect(buildServiceArea('Austin', 'tx')).toBe('Austin, TX');
  });

  it('returns city only when state missing', () => {
    expect(buildServiceArea('Houston', '')).toBe('Houston');
  });

  it('returns null when all empty', () => {
    expect(buildServiceArea('', '')).toBe(null);
  });
});
