import { DEFAULT_SERVICE_AREA_RADIUS } from '../../constants/serviceAreaRadius';
import { mapServiceAreaRow, mapServiceAreaRowToStructuredLocation } from '../mapServiceAreaRow';

const row = {
  id: 'area-1',
  label: 'Austin, TX 78701',
  city: 'Austin',
  state_code: 'TX',
  postal_code: '78701',
  latitude: 30.2672,
  longitude: -97.7431,
  radius_miles: 30,
  place_type: 'place',
  provider_place_id: 'place.123',
};

describe('mapServiceAreaRowToStructuredLocation', () => {
  it('maps a service-area row to a StructuredLocation', () => {
    expect(mapServiceAreaRowToStructuredLocation(row)).toEqual({
      providerId: 'place.123',
      label: 'Austin, TX 78701',
      searchValue: 'Austin, TX 78701',
      street: '',
      city: 'Austin',
      state: 'TX',
      zip: '78701',
      latitude: 30.2672,
      longitude: -97.7431,
      placeType: 'place',
    });
  });

  it('returns null without coordinates', () => {
    expect(mapServiceAreaRowToStructuredLocation({ ...row, latitude: null, longitude: null })).toBe(
      null,
    );
  });
});

describe('mapServiceAreaRow', () => {
  it('includes radius miles', () => {
    expect(mapServiceAreaRow(row)).toEqual({
      location: mapServiceAreaRowToStructuredLocation(row),
      radiusMiles: 30,
      label: 'Austin, TX 78701',
    });
  });

  it('falls back to the default radius', () => {
    expect(mapServiceAreaRow({ ...row, radius_miles: 12 }).radiusMiles).toBe(
      Number(DEFAULT_SERVICE_AREA_RADIUS),
    );
  });
});
