import { resolveLegacyServiceLocation } from '../resolveLegacyServiceLocation';
import { hasMapTilerApiKey } from '../../api/mapTilerGeocoding';
import { searchLocations } from '../../services/locationAutocomplete';

jest.mock('../../api/mapTilerGeocoding', () => ({
  formatLocationDisplayLabel: jest.requireActual('../../api/mapTilerGeocoding')
    .formatLocationDisplayLabel,
  hasMapTilerApiKey: jest.fn(),
}));

jest.mock('../../services/locationAutocomplete', () => ({
  searchLocations: jest.fn(),
}));

const austin = {
  providerId: 'place.1',
  label: 'Austin, TX 78701',
  searchValue: 'Austin, TX 78701',
  street: '',
  city: 'Austin',
  state: 'TX',
  zip: '78701',
  latitude: 30.2672,
  longitude: -97.7431,
  placeType: 'place',
};

describe('resolveLegacyServiceLocation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    hasMapTilerApiKey.mockReturnValue(true);
  });

  it('returns null without city and state', async () => {
    await expect(resolveLegacyServiceLocation({ city: 'Austin' })).resolves.toBeNull();
    expect(searchLocations).not.toHaveBeenCalled();
  });

  it('prefers an exact city and state match', async () => {
    searchLocations.mockResolvedValue([
      { ...austin, city: 'Round Rock', label: 'Round Rock, TX' },
      austin,
    ]);

    await expect(
      resolveLegacyServiceLocation({ city: 'Austin', state: 'tx', zip: '78701' }),
    ).resolves.toEqual(austin);
    expect(searchLocations).toHaveBeenCalledWith('Austin, TX 78701', {
      mode: 'service-origin',
      signal: undefined,
    });
  });

  it('returns null when MapTiler is unavailable', async () => {
    hasMapTilerApiKey.mockReturnValue(false);
    await expect(resolveLegacyServiceLocation({ city: 'Austin', state: 'TX' })).resolves.toBeNull();
    expect(searchLocations).not.toHaveBeenCalled();
  });
});
