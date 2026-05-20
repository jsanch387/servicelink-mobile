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

jest.mock('../../features/notifications/screens/NotificationsInboxScreen', () => ({
  NotificationsInboxScreen: () => null,
}));

function signedInSession() {
  return {
    session: { access_token: 't', user: { id: 'user_1' } },
    isReady: true,
    user: { id: 'user_1' },
  };
}

describe('AuthNavigator subscription gate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useOnboardingGate.mockReturnValue({ needsOnboarding: false, isGateReady: true });
    useAuth.mockReturnValue(signedInSession());
  });

  it('shows boot view while account bundle is loading (no tabs yet)', () => {
    useSubscription.mockReturnValue({
      hasProAccess: false,
      isLoading: true,
      ownerProfile: null,
    });

    renderWithProviders(<AuthNavigator />);
    expect(screen.getByTestId('subscription-boot')).toBeTruthy();
    expect(screen.queryByTestId('main-tabs')).toBeNull();
  });

  it('shows main tabs for free tier when subscription data is loaded', () => {
    useSubscription.mockReturnValue({
      hasProAccess: false,
      isLoading: false,
      ownerProfile: { subscription_tier: 'free' },
    });

    renderWithProviders(<AuthNavigator />);
    expect(screen.getByTestId('main-tabs')).toBeTruthy();
    expect(screen.queryByTestId('subscription-boot')).toBeNull();
  });

  it('shows main tabs when explicit free tier with Stripe remnants after cancel', () => {
    useSubscription.mockReturnValue({
      hasProAccess: false,
      isLoading: false,
      ownerProfile: {
        subscription_tier: 'free',
        stripe_customer_id: 'cus_legacy',
        subscription_status: 'canceled',
      },
    });

    renderWithProviders(<AuthNavigator />);
    expect(screen.getByTestId('main-tabs')).toBeTruthy();
    expect(screen.queryByTestId('subscription-boot')).toBeNull();
  });

  it('shows main tabs when former Pro tier lost access but profile is not explicit free', () => {
    useSubscription.mockReturnValue({
      hasProAccess: false,
      isLoading: false,
      ownerProfile: {
        subscription_tier: 'pro',
        subscription_status: 'canceled',
        stripe_customer_id: 'cus_legacy',
        stripe_subscription_id: 'sub_dead',
      },
    });

    renderWithProviders(<AuthNavigator />);
    expect(screen.getByTestId('main-tabs')).toBeTruthy();
    expect(screen.queryByTestId('subscription-boot')).toBeNull();
  });

  it('shows main tabs when user has Pro access', () => {
    useSubscription.mockReturnValue({
      hasProAccess: true,
      isLoading: false,
      ownerProfile: { subscription_tier: 'pro' },
    });

    renderWithProviders(<AuthNavigator />);
    expect(screen.getByTestId('main-tabs')).toBeTruthy();
    expect(screen.queryByTestId('subscription-boot')).toBeNull();
  });
});
