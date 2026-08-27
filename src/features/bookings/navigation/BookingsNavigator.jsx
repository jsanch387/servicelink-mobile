import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { nativeStackScreenOptions } from '../../../navigation/nativeStackScreenOptions';
import { ROUTES } from '../../../routes/routes';
import { useTheme } from '../../../theme';
import { CustomerDetailsScreen } from '../../customers/screens/CustomerDetailsScreen';
import { BookingActivityScreen } from '../screens/BookingActivityScreen';
import { BookingDetailsScreen } from '../screens/BookingDetailsScreen';
import { BookingsScreen } from '../screens/BookingsScreen';

const Stack = createNativeStackNavigator();

export function BookingsNavigator() {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={nativeStackScreenOptions({ colors })}
    >
      <Stack.Screen
        component={BookingsScreen}
        name={ROUTES.BOOKINGS_LIST}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        component={BookingDetailsScreen}
        name={ROUTES.BOOKING_DETAILS}
        options={{
          title: 'Booking details',
          headerBackButtonDisplayMode: 'minimal',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        component={BookingActivityScreen}
        name={ROUTES.BOOKING_ACTIVITY}
        options={{
          title: 'Customer updates',
          headerBackButtonDisplayMode: 'minimal',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        component={CustomerDetailsScreen}
        name={ROUTES.CUSTOMER_DETAILS}
        options={{
          title: 'Customer details',
          headerBackButtonDisplayMode: 'minimal',
          headerBackTitleVisible: false,
        }}
      />
    </Stack.Navigator>
  );
}
