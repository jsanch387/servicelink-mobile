import Ionicons from '@expo/vector-icons/Ionicons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BookingsNavigator } from '../features/bookings';
import { CustomersNavigator } from '../features/customers/navigation/CustomersNavigator';
import { HomeScreen } from '../features/home/screens/HomeScreen';
import { MoreNavigator } from '../features/more';
import { NotificationsRealtimeBridge } from '../features/notifications/components/NotificationsRealtimeBridge';
import { PushTokenRegistration } from '../features/notifications/components/PushTokenRegistration';
import { PaymentsScreen } from '../features/payments/screens/PaymentsScreen';
import { MAIN_TAB_CONFIG, ROUTES } from '../routes/routes';
import { FONT_FAMILIES, useTheme } from '../theme';
import { MainTabBar } from './MainTabBar';
import { nestedTabPressResetToRootListeners } from './nestedTabPressResetToRoot';

const Tab = createBottomTabNavigator();

const tabScreens = {
  [ROUTES.HOME]: HomeScreen,
  [ROUTES.BOOKINGS]: BookingsNavigator,
  [ROUTES.CUSTOMERS]: CustomersNavigator,
  [ROUTES.PAYMENTS]: PaymentsScreen,
  [ROUTES.MORE]: MoreNavigator,
};

export function MainTabNavigator() {
  const { colors } = useTheme();

  return (
    <>
      <NotificationsRealtimeBridge />
      <PushTokenRegistration />
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: colors.shell },
          tabBarActiveTintColor: colors.tabBarActive,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarLabelStyle: {
            fontFamily: FONT_FAMILIES.semibold,
            fontSize: 11,
          },
        }}
        tabBar={(props) => <MainTabBar {...props} />}
      >
        {MAIN_TAB_CONFIG.map(({ route, label, icon }) => {
          const nestedRootByTab =
            route === ROUTES.BOOKINGS
              ? ROUTES.BOOKINGS_LIST
              : route === ROUTES.CUSTOMERS
                ? ROUTES.CUSTOMERS_LIST
                : route === ROUTES.MORE
                  ? ROUTES.MORE_HOME
                  : null;

          return (
            <Tab.Screen
              key={route}
              component={tabScreens[route]}
              listeners={
                nestedRootByTab
                  ? (props) =>
                      nestedTabPressResetToRootListeners(props, { rootScreen: nestedRootByTab })
                  : undefined
              }
              name={route}
              options={{
                tabBarIcon: ({ color, focused, size }) => (
                  <Ionicons color={color} name={icon} size={focused ? 24 : 22} />
                ),
                tabBarLabel: label,
              }}
            />
          );
        })}
      </Tab.Navigator>
    </>
  );
}
