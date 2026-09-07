import { screen } from '@testing-library/react-native';
import { useAuth } from '../../features/auth';
import { useOnboardingGate } from '../../features/onboarding';
import { useSubscription } from '../../features/subscription';
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

describe('AuthNavigator logged out', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useOnboardingGate.mockReturnValue({
      needsOnboarding: false,
      isGateReady: true,
      postActivationHandoff: false,
    });
    useSubscription.mockReturnValue({
      hasProAccess: false,
      isLoading: false,
      ownerProfile: null,
    });
    useAuth.mockReturnValue({
      session: null,
      isReady: true,
      user: null,
    });
  });

  it('opens on sign in, not welcome', () => {
    renderWithProviders(<AuthNavigator />);
    expect(screen.getByTestId('login-screen')).toBeTruthy();
    expect(screen.queryByTestId('welcome-screen')).toBeNull();
  });
});
