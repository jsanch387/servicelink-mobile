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

jest.mock('../MainTabBar', () => ({
  MainTabBar: () => null,
}));

jest.mock('../../features/notifications/components/NotificationsRealtimeBridge', () => ({
  NotificationsRealtimeBridge: () => null,
}));

jest.mock('../../features/notifications/components/PushTokenRegistration', () => ({
  PushTokenRegistration: () => null,
}));

jest.mock('../../features/auth/components/IosAppPresenceRegistration', () => ({
  IosAppPresenceRegistration: () => null,
}));

function renderTabs() {
  return renderWithProviders(
    <NavigationContainer>
      <MainTabNavigator />
    </NavigationContainer>,
  );
}

describe('MainTabNavigator Home tab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('always mounts Home on Home tab (paywall is full-screen in AuthNavigator)', () => {
    useSubscription.mockReturnValue({
      hasProAccess: false,
      isOwnerProfileLoaded: true,
    });

    renderTabs();
    expect(screen.getByTestId('home-tab-screen')).toBeTruthy();
  });
});
