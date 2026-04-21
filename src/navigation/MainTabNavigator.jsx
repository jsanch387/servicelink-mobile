import Ionicons from '@expo/vector-icons/Ionicons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BookingsNavigator } from '../features/bookings';
import { CustomersNavigator } from '../features/customers/navigation/CustomersNavigator';
import { HomeScreen } from '../features/home/screens/HomeScreen';
import { PaymentsScreen } from '../features/payments/screens/PaymentsScreen';
import { ProfileScreen } from '../features/profile/screens/ProfileScreen';
import { MAIN_TAB_CONFIG, ROUTES } from '../routes/routes';
import { useTheme } from '../theme';
import { MainTabBar } from './MainTabBar';

const Tab = createBottomTabNavigator();

const TAB_SCREENS = {
  [ROUTES.HOME]: HomeScreen,
  [ROUTES.BOOKINGS]: BookingsNavigator,
  [ROUTES.CUSTOMERS]: CustomersNavigator,
  [ROUTES.PAYMENTS]: PaymentsScreen,
  [ROUTES.PROFILE]: ProfileScreen,
};

export function MainTabNavigator() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.shell },
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
      tabBar={(props) => <MainTabBar {...props} />}
    >
      {MAIN_TAB_CONFIG.map(({ route, label, icon }) => (
        <Tab.Screen
          key={route}
          component={TAB_SCREENS[route]}
          name={route}
          options={{
            tabBarIcon: ({ color, focused, size }) => (
              <Ionicons color={color} name={icon} size={focused ? 24 : 22} />
            ),
            tabBarLabel: label,
          }}
        />
      ))}
    </Tab.Navigator>
  );
}
