import { mapFeature } from '../mapTilerGeocoding';

describe('mapFeature', () => {
  it('keeps a street address when the city is a joint municipality', () => {
    const location = mapFeature({
      id: 'address.21416852',
      place_type: ['address'],
      text: 'Avis Street',
      address: '8790',
      center: [-83.131305, 42.304437],
      context: [
        { id: 'postal_code.4291744', text: '48209' },
        { id: 'joint_municipality.18437', text: 'Detroit' },
        { id: 'region.2175', text: 'Michigan', short_code: 'us-mi' },
      ],
    });

    expect(location).toMatchObject({
      street: '8790 Avis Street',
      city: 'Detroit',
      state: 'MI',
      zip: '48209',
      label: '8790 Avis Street, Detroit, MI 48209',
    });
  });
});
