import { screen } from '@testing-library/react-native';
import { useAuth } from '../../features/auth';
import { useOnboardingGate } from '../../features/onboarding';
import { useSubscription } from '../../features/subscription';
import { useNotificationPermissionPrimerGate } from '../../features/notifications/context/NotificationPermissionPrimerGateContext';
import { renderWithProviders } from '../../features/home/__tests__/testUtils';
import { AuthNavigator } from '../AuthNavigator';

jest.mock('../../features/auth', () => ({
  ...jest.requireActual('../../features/auth'),
  useAuth: jest.fn(),
}));

jest.mock('../../features/onboarding', () => ({
  ...jest.requireActual('../../features/onboarding'),
  useOnboardingGate: jest.fn(),
}));

jest.mock('../../features/subscription', () => ({
  ...jest.requireActual('../../features/subscription'),
  useSubscription: jest.fn(),
}));

jest.mock('../../features/notifications/context/NotificationPermissionPrimerGateContext', () => ({
  useNotificationPermissionPrimerGate: jest.fn(),
}));

jest.mock('../MainTabNavigator', () => ({
  MainTabNavigator: function MockMainTabNavigator() {
    const React = require('react');
    const { Text } = require('react-native');
    return <Text testID="main-tabs">MAIN_TABS</Text>;
  },
}));

jest.mock('../../features/bookings', () => ({
  CreateAppointmentScreen: () => null,
}));

jest.mock('../../features/payments', () => ({
  CreatePaymentScreen: () => null,
}));

jest.mock('../../features/notifications/screens/NotificationsInboxScreen', () => ({
  NotificationsInboxScreen: () => null,
}));

jest.mock('../../features/notifications/screens/NotificationPermissionGateScreen', () => ({
  NotificationPermissionGateScreen: function MockNotificationPermissionGateScreen() {
    const React = require('react');
    const { Text } = require('react-native');
    return <Text testID="notification-permission-gate">PRIMER</Text>;
  },
}));

function signedInSession() {
  return {
    session: { access_token: 't', user: { id: 'user_1' } },
    isReady: true,
    user: { id: 'user_1' },
  };
}

describe('AuthNavigator notification permission primer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue(signedInSession());
    useOnboardingGate.mockReturnValue({ needsOnboarding: false, isGateReady: true });
    useSubscription.mockReturnValue({
      hasProAccess: true,
      isLoading: false,
      ownerProfile: { subscription_tier: 'pro' },
    });
  });

  it('shows the primer after sign-in when permission is still undetermined', () => {
    useNotificationPermissionPrimerGate.mockReturnValue({
      needsPrimer: true,
      isPrimerReady: true,
      completePrimer: jest.fn(),
    });

    renderWithProviders(<AuthNavigator />);

    expect(screen.getByTestId('notification-permission-gate')).toBeTruthy();
    expect(screen.queryByTestId('main-tabs')).toBeNull();
  });

  it('shows main tabs after the primer is finished', () => {
    useNotificationPermissionPrimerGate.mockReturnValue({
      needsPrimer: false,
      isPrimerReady: true,
      completePrimer: jest.fn(),
    });

    renderWithProviders(<AuthNavigator />);

    expect(screen.getByTestId('main-tabs')).toBeTruthy();
    expect(screen.queryByTestId('notification-permission-gate')).toBeNull();
  });
});
