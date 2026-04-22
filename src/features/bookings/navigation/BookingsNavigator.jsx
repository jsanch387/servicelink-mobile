import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ROUTES } from '../../../routes/routes';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import { BookingDetailsScreen } from '../screens/BookingDetailsScreen';
import { BookingsScreen } from '../screens/BookingsScreen';

const Stack = createNativeStackNavigator();

export function BookingsNavigator() {
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
    </Stack.Navigator>
  );
}
