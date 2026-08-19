import { fireEvent, screen } from '@testing-library/react-native';
import { MaintenanceInviteScreen } from '../maintenance-invite/screens/MaintenanceInviteScreen';
import {
  MAINTENANCE_CREATION_DISABLED_MESSAGE,
  MAINTENANCE_SUNSET_NOTICE_CTA,
  MAINTENANCE_SUNSET_NOTICE_TITLE,
} from '../../maintenance/constants';
import { renderWithProviders } from '../../home/__tests__/testUtils';
import { useSubscriptionsAccess } from '../../subscriptions/hooks/useSubscriptionsAccess';

const mockNavigate = jest.fn();
const mockSetOptions = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    setOptions: mockSetOptions,
  }),
}));

jest.mock('../../subscriptions/hooks/useSubscriptionsAccess', () => ({
  useSubscriptionsAccess: jest.fn(() => ({
    featureEnabled: true,
    canUseSubscriptions: true,
    showUpsell: false,
    isReady: true,
  })),
}));

describe('MaintenanceInviteScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSubscriptionsAccess.mockReturnValue({
      featureEnabled: true,
      canUseSubscriptions: true,
      showUpsell: false,
      isReady: true,
    });
  });

  it('blocks new offers and routes to subscriptions', () => {
    renderWithProviders(<MaintenanceInviteScreen />);

    expect(screen.getByText(MAINTENANCE_SUNSET_NOTICE_TITLE)).toBeTruthy();
    expect(screen.getByText(MAINTENANCE_CREATION_DISABLED_MESSAGE)).toBeTruthy();
    fireEvent.press(screen.getByText(MAINTENANCE_SUNSET_NOTICE_CTA));
    expect(mockNavigate).toHaveBeenCalledWith('More', { screen: 'Subscriptions' });
  });

  it('hides the subscriptions CTA when the feature is gated off', () => {
    useSubscriptionsAccess.mockReturnValue({
      featureEnabled: false,
      canUseSubscriptions: false,
      showUpsell: false,
      isReady: true,
    });

    renderWithProviders(<MaintenanceInviteScreen />);

    expect(screen.getByText(MAINTENANCE_CREATION_DISABLED_MESSAGE)).toBeTruthy();
    expect(screen.queryByText(MAINTENANCE_SUNSET_NOTICE_CTA)).toBeNull();
  });
});
