import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ROUTES } from '../../../routes/routes';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import { AvailabilityScreen } from '../../availability/screens/AvailabilityScreen';
import { BookingLinkScreen } from '../../bookingLink/screens/BookingLinkScreen';
import { PaymentsScreen } from '../../payments/screens/PaymentsScreen';
import { QuotesScreen } from '../../quotes/screens/QuotesScreen';
import { ServicesScreen } from '../../services';
import { ServiceEditScreen } from '../../services/screens/ServiceEditScreen';
import { AccountSettingsScreen } from '../screens/AccountSettingsScreen';
import { MoreScreen } from '../screens/MoreScreen';
import { HelpScreen } from '../screens/HelpScreen';
import { NotificationSettingsScreen } from '../screens/NotificationSettingsScreen';

const Stack = createNativeStackNavigator();

export function MoreNavigator() {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: colors.shell },
        headerTitleStyle: {
          fontFamily: FONT_FAMILIES.semibold,
        },
      }}
    >
      <Stack.Screen
        component={MoreScreen}
        name={ROUTES.MORE_HOME}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        component={AccountSettingsScreen}
        name={ROUTES.ACCOUNT_SETTINGS}
        options={{
          title: 'Account',
          headerBackButtonDisplayMode: 'minimal',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        component={NotificationSettingsScreen}
        name={ROUTES.NOTIFICATIONS}
        options={{
          title: 'Notification settings',
          headerBackButtonDisplayMode: 'minimal',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        component={HelpScreen}
        name={ROUTES.HELP}
        options={{
          title: 'Help',
          headerBackButtonDisplayMode: 'minimal',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        component={ServicesScreen}
        name={ROUTES.SERVICES_LIST}
        options={{
          title: 'Services',
          headerBackButtonDisplayMode: 'minimal',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        component={ServiceEditScreen}
        name={ROUTES.SERVICES_EDIT}
        options={{
          title: 'Edit service',
          headerBackButtonDisplayMode: 'minimal',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        component={AvailabilityScreen}
        name={ROUTES.AVAILABILITY}
        options={{
          title: 'Availability',
          headerBackButtonDisplayMode: 'minimal',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        component={QuotesScreen}
        name={ROUTES.QUOTES}
        options={{
          title: 'Quotes',
          headerBackButtonDisplayMode: 'minimal',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        component={BookingLinkScreen}
        name={ROUTES.BOOKING_LINK}
        options={{
          title: 'Booking link',
          headerBackButtonDisplayMode: 'minimal',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        component={PaymentsScreen}
        name={ROUTES.MORE_PAYMENTS}
        options={{
          title: 'Payments',
          headerBackButtonDisplayMode: 'minimal',
          headerBackTitleVisible: false,
        }}
      />
    </Stack.Navigator>
  );
}
