import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ROUTES } from '../../../routes/routes';
import { useTheme } from '../../../theme';
import { CustomerDetailsScreen } from '../screens/CustomerDetailsScreen';
import { CustomersScreen } from '../screens/CustomersScreen';

const Stack = createNativeStackNavigator();

export function CustomersNavigator() {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: colors.shell },
      }}
    >
      <Stack.Screen
        component={CustomersScreen}
        name={ROUTES.CUSTOMERS_LIST}
        options={{ headerShown: false }}
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
