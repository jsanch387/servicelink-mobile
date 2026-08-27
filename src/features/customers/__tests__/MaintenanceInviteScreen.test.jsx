import { screen } from '@testing-library/react-native';
import { MaintenanceInviteScreen } from '../maintenance-invite/screens/MaintenanceInviteScreen';
import {
  MAINTENANCE_CREATION_DISABLED_MESSAGE,
  MAINTENANCE_SUNSET_NOTICE_CTA,
  MAINTENANCE_SUNSET_NOTICE_TITLE,
} from '../../maintenance/constants';
import { renderWithProviders } from '../../home/__tests__/testUtils';

const mockSetOptions = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    setOptions: mockSetOptions,
  }),
}));

describe('MaintenanceInviteScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('blocks new offers and explains subscriptions are coming soon', () => {
    renderWithProviders(<MaintenanceInviteScreen />);

    expect(screen.getByText(MAINTENANCE_SUNSET_NOTICE_TITLE)).toBeTruthy();
    expect(screen.getByText(MAINTENANCE_CREATION_DISABLED_MESSAGE)).toBeTruthy();
    expect(screen.queryByText(MAINTENANCE_SUNSET_NOTICE_CTA)).toBeNull();
  });
});
