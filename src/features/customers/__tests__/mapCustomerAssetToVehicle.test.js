import {
  formatPastVehicleLine,
  mapCustomerAssetToVehicle,
  mapCustomerAssetsToPastVehicles,
  parseVehicleLabel,
  pastVehiclesMatch,
} from '../utils/mapCustomerAssetToVehicle';

describe('formatPastVehicleLine', () => {
  it('joins year make model', () => {
    expect(formatPastVehicleLine({ year: '2023', make: 'Cadillac', model: 'Escalade' })).toBe(
      '2023 Cadillac Escalade',
    );
  });
});

describe('parseVehicleLabel', () => {
  it('splits a year-first label', () => {
    expect(parseVehicleLabel('2022 GMC Yukon AT4')).toEqual({
      year: '2022',
      make: 'GMC',
      model: 'Yukon AT4',
    });
  });

  it('returns empty parts for a blank label', () => {
    expect(parseVehicleLabel('')).toEqual({ year: '', make: '', model: '' });
  });
});

describe('pastVehiclesMatch', () => {
  it('matches year make model case-insensitively', () => {
    expect(
      pastVehiclesMatch(
        { year: '2012', make: 'Dodge', model: 'Ram 1500' },
        { year: '2012', make: 'dodge', model: 'RAM 1500' },
      ),
    ).toBe(true);
  });

  it('does not match empty vehicles', () => {
    expect(pastVehiclesMatch({ year: '', make: '', model: '' }, { year: '', make: '', model: '' })).toBe(
      false,
    );
  });
});

describe('mapCustomerAssetToVehicle', () => {
  it('maps a vehicle asset from attributes', () => {
    expect(
      mapCustomerAssetToVehicle({
        id: 'a1',
        asset_type: 'vehicle',
        label: '2012 Dodge Ram 1500',
        attributes: { year: '2012', make: 'Dodge', model: 'Ram 1500' },
      }),
    ).toEqual({
      id: 'a1',
      label: '2012 Dodge Ram 1500',
      year: '2012',
      make: 'Dodge',
      model: 'Ram 1500',
    });
  });

  it('falls back to the label when attributes are empty', () => {
    expect(
      mapCustomerAssetToVehicle({
        id: 'a2',
        asset_type: 'vehicle',
        label: '2023 Cadillac Escalade',
        attributes: {},
      }),
    ).toEqual({
      id: 'a2',
      label: '2023 Cadillac Escalade',
      year: '2023',
      make: 'Cadillac',
      model: 'Escalade',
    });
  });

  it('ignores non-vehicle assets', () => {
    expect(
      mapCustomerAssetToVehicle({
        id: 'p1',
        asset_type: 'pet',
        label: 'Buddy',
        attributes: { name: 'Buddy' },
      }),
    ).toBeNull();
  });

  it('ignores incomplete vehicles', () => {
    expect(
      mapCustomerAssetToVehicle({
        id: 'a3',
        asset_type: 'vehicle',
        label: 'Toyota',
        attributes: { make: 'Toyota' },
      }),
    ).toBeNull();
  });
});

describe('mapCustomerAssetsToPastVehicles', () => {
  it('dedupes the same year make model and skips other types', () => {
    const out = mapCustomerAssetsToPastVehicles([
      {
        id: 'a1',
        asset_type: 'vehicle',
        label: '2023 Cadillac Escalade',
        attributes: { year: '2023', make: 'Cadillac', model: 'Escalade' },
      },
      {
        id: 'a1-dup',
        asset_type: 'vehicle',
        label: '2023 cadillac escalade',
        attributes: { year: '2023', make: 'Cadillac', model: 'Escalade' },
      },
      {
        id: 'p1',
        asset_type: 'pet',
        label: 'Buddy',
        attributes: {},
      },
      {
        id: 'a2',
        asset_type: 'vehicle',
        label: '2012 Dodge Ram 1500',
        attributes: { year: '2012', make: 'Dodge', model: 'Ram 1500' },
      },
    ]);

    expect(out.map((vehicle) => vehicle.id)).toEqual(['a1', 'a2']);
  });
});
