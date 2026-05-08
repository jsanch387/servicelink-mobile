import { NavigationContainer } from '@react-navigation/native';
import { screen } from '@testing-library/react-native';
import { useSubscription } from '../../features/subscription';
import { renderWithProviders } from '../../features/home/__tests__/testUtils';
import { MainTabNavigator } from '../MainTabNavigator';

jest.mock('../../features/subscription', () => ({
  ...jest.requireActual('../../features/subscription'),
  useSubscription: jest.fn(),
}));

jest.mock('../../features/bookings', () => ({
  BookingsNavigator: () => null,
}));

jest.mock('../../features/customers/navigation/CustomersNavigator', () => ({
  CustomersNavigator: () => null,
}));

jest.mock('../../features/home/screens/HomeScreen', () => ({
  HomeScreen: function MockHomeScreen() {
    const React = require('react');
    const { Text } = require('react-native');
    return <Text testID="home-tab-screen">HOME_TAB</Text>;
  },
}));

jest.mock('../../features/more', () => ({
  MoreNavigator: () => null,
}));

jest.mock('../../features/subscription/screens/UpgradePaywallScreen', () => ({
  UpgradePaywallScreen: function MockUpgradePaywallScreen() {
    const React = require('react');
    const { Text } = require('react-native');
    return <Text testID="paywall-tab-screen">PAYWALL_TAB</Text>;
  },
}));

jest.mock('../MainTabBar', () => ({
  MainTabBar: () => null,
}));

function renderTabs() {
  return renderWithProviders(
    <NavigationContainer>
      <MainTabNavigator />
    </NavigationContainer>,
  );
}

describe('MainTabNavigator paywall gate (Home tab)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('mounts Home when profile is not loaded yet (avoid paywall flash)', () => {
    useSubscription.mockReturnValue({
      hasProAccess: false,
      isOwnerProfileLoaded: false,
    });

    renderTabs();
    expect(screen.getByTestId('home-tab-screen')).toBeTruthy();
    expect(screen.queryByTestId('paywall-tab-screen')).toBeNull();
  });

  it('mounts upgrade paywall on Home when profile loaded and user lacks Pro access', () => {
    useSubscription.mockReturnValue({
      hasProAccess: false,
      isOwnerProfileLoaded: true,
    });

    renderTabs();
    expect(screen.getByTestId('paywall-tab-screen')).toBeTruthy();
    expect(screen.queryByTestId('home-tab-screen')).toBeNull();
  });

  it('mounts Home when user has Pro access', () => {
    useSubscription.mockReturnValue({
      hasProAccess: true,
      isOwnerProfileLoaded: true,
    });

    renderTabs();
    expect(screen.getByTestId('home-tab-screen')).toBeTruthy();
    expect(screen.queryByTestId('paywall-tab-screen')).toBeNull();
  });
});
