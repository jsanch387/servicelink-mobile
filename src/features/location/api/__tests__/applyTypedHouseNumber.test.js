import { applyTypedHouseNumber } from '../mapTilerGeocoding';

function location(overrides = {}) {
  return {
    providerId: 'address.1',
    label: 'Burkemont Avenue, Morganton, NC 28655',
    searchValue: 'Burkemont Avenue, Morganton, NC 28655',
    street: 'Burkemont Avenue',
    city: 'Morganton',
    state: 'NC',
    zip: '28655',
    latitude: 35.74,
    longitude: -81.68,
    placeType: 'address',
    ...overrides,
  };
}

describe('applyTypedHouseNumber', () => {
  it('keeps the typed house number when MapTiler only returns the street', () => {
    const [match] = applyTypedHouseNumber([location()], '1025 burkemont ave');
    expect(match.street).toBe('1025 Burkemont Avenue');
    expect(match.label).toBe('1025 Burkemont Avenue, Morganton, NC 28655');
  });

  it('does not stamp the number onto a different street variant', () => {
    const [match] = applyTypedHouseNumber(
      [
        location({
          street: 'Burkemont Avenue A/b',
          label: 'Burkemont Avenue A/b, Morganton, NC 28655',
        }),
      ],
      '1025 burkemont ave',
    );
    expect(match.street).toBe('Burkemont Avenue A/b');
  });

  it('leaves a result that already has a house number alone', () => {
    const [match] = applyTypedHouseNumber(
      [location({ street: '1600 Pennsylvania Avenue Northwest', zip: '20500' })],
      '1600 pennsylvania ave nw',
    );
    expect(match.street).toBe('1600 Pennsylvania Avenue Northwest');
  });

  it('does not treat a leading ZIP as a house number', () => {
    const [match] = applyTypedHouseNumber([location()], '28655 burkemont');
    expect(match.street).toBe('Burkemont Avenue');
  });
});
