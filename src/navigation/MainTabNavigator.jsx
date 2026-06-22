import Ionicons from '@expo/vector-icons/Ionicons';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BookingsNavigator } from '../features/bookings';
import { CustomersNavigator } from '../features/customers/navigation/CustomersNavigator';
import { HomeScreen } from '../features/home/screens/HomeScreen';
import { MoreNavigator } from '../features/more';
import { IosAppPresenceRegistration } from '../features/auth/components/IosAppPresenceRegistration';
import { TapToPayWarmupBootstrap } from '../features/tap-to-pay/components/TapToPayWarmupBootstrap';
import { AppUpdateAnnouncementsBootstrap } from '../features/appUpdates';
import { NotificationsRealtimeBridge } from '../features/notifications/components/NotificationsRealtimeBridge';
import { PushTokenRegistration } from '../features/notifications/components/PushTokenRegistration';
import { PaymentsScreen } from '../features/payments/screens/PaymentsScreen';
import { MAIN_TAB_CONFIG, ROUTES } from '../routes/routes';
import { FONT_FAMILIES, useTheme } from '../theme';
import { MainTabBar } from './MainTabBar';
import { nestedTabPressResetToRootListeners } from './nestedTabPressResetToRoot';

const Tab = createBottomTabNavigator();

/** Screens inside a tab stack where the bottom tab bar should be hidden. */
const CUSTOMERS_TAB_BAR_HIDDEN_ROUTES = new Set([ROUTES.MAINTENANCE_INVITE]);

function customersTabBarOptions({ route }) {
  const routeName = getFocusedRouteNameFromRoute(route) ?? ROUTES.CUSTOMERS_LIST;
  const hideTabBar = CUSTOMERS_TAB_BAR_HIDDEN_ROUTES.has(routeName);

  return {
    tabBarStyle: hideTabBar ? { display: 'none' } : undefined,
  };
}

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
      <IosAppPresenceRegistration />
      <TapToPayWarmupBootstrap />
      <PushTokenRegistration />
      <AppUpdateAnnouncementsBootstrap />
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
              options={
                route === ROUTES.CUSTOMERS
                  ? ({ route: tabRoute }) => ({
                      ...customersTabBarOptions({ route: tabRoute }),
                      tabBarIcon: ({ color, focused, size }) => (
                        <Ionicons color={color} name={icon} size={focused ? 24 : 22} />
                      ),
                      tabBarLabel: label,
                    })
                  : {
                      tabBarIcon: ({ color, focused, size }) => (
                        <Ionicons color={color} name={icon} size={focused ? 24 : 22} />
                      ),
                      tabBarLabel: label,
                    }
              }
            />
          );
        })}
      </Tab.Navigator>
    </>
  );
}
