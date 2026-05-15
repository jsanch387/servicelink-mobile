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

jest.mock('../../features/subscription/screens/UpgradePaywallScreen', () => ({
  UpgradePaywallScreen: function MockUpgradePaywallScreen() {
    const React = require('react');
    const { Text } = require('react-native');
    return <Text testID="fullscreen-paywall">PAYWALL_FULL</Text>;
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
      isPaywallDataStable: false,
      isLoading: true,
      ownerProfile: null,
    });

    renderWithProviders(<AuthNavigator />);
    expect(screen.getByTestId('subscription-boot')).toBeTruthy();
    expect(screen.queryByTestId('main-tabs')).toBeNull();
    expect(screen.queryByTestId('fullscreen-paywall')).toBeNull();
  });

  it('shows main tabs for never-billed Free when stable (no Stripe history cohort)', () => {
    useSubscription.mockReturnValue({
      hasProAccess: false,
      isPaywallDataStable: true,
      isLoading: false,
      ownerProfile: { subscription_tier: 'free' },
    });

    renderWithProviders(<AuthNavigator />);
    expect(screen.getByTestId('main-tabs')).toBeTruthy();
    expect(screen.queryByTestId('fullscreen-paywall')).toBeNull();
    expect(screen.queryByTestId('subscription-boot')).toBeNull();
  });

  it('shows main tabs when explicit free tier with Stripe remnants after cancel (not paywalled)', () => {
    useSubscription.mockReturnValue({
      hasProAccess: false,
      isPaywallDataStable: true,
      isLoading: false,
      ownerProfile: {
        subscription_tier: 'free',
        stripe_customer_id: 'cus_legacy',
        subscription_status: 'canceled',
      },
    });

    renderWithProviders(<AuthNavigator />);
    expect(screen.getByTestId('main-tabs')).toBeTruthy();
    expect(screen.queryByTestId('fullscreen-paywall')).toBeNull();
    expect(screen.queryByTestId('subscription-boot')).toBeNull();
  });

  it('shows full-screen upgrade when Pro tier lost access but not flipped to free (cohort B)', () => {
    useSubscription.mockReturnValue({
      hasProAccess: false,
      isPaywallDataStable: true,
      isLoading: false,
      ownerProfile: {
        subscription_tier: 'pro',
        subscription_status: 'canceled',
        stripe_customer_id: 'cus_legacy',
        stripe_subscription_id: 'sub_dead',
      },
    });

    renderWithProviders(<AuthNavigator />);
    expect(screen.getByTestId('fullscreen-paywall')).toBeTruthy();
    expect(screen.queryByTestId('main-tabs')).toBeNull();
    expect(screen.queryByTestId('subscription-boot')).toBeNull();
  });

  it('shows main tabs when user has Pro access', () => {
    useSubscription.mockReturnValue({
      hasProAccess: true,
      isPaywallDataStable: true,
      isLoading: false,
      ownerProfile: { subscription_tier: 'pro' },
    });

    renderWithProviders(<AuthNavigator />);
    expect(screen.getByTestId('main-tabs')).toBeTruthy();
    expect(screen.queryByTestId('fullscreen-paywall')).toBeNull();
    expect(screen.queryByTestId('subscription-boot')).toBeNull();
  });

  it('does not flash paywall while subscription data is revalidating (unstable, no Pro yet)', () => {
    useSubscription.mockReturnValue({
      hasProAccess: false,
      isPaywallDataStable: false,
      isLoading: false,
      ownerProfile: {
        subscription_tier: 'free',
        stripe_customer_id: 'cus_legacy',
      },
    });

    renderWithProviders(<AuthNavigator />);
    expect(screen.getByTestId('main-tabs')).toBeTruthy();
    expect(screen.queryByTestId('fullscreen-paywall')).toBeNull();
    expect(screen.queryByTestId('subscription-boot')).toBeNull();
  });
});
