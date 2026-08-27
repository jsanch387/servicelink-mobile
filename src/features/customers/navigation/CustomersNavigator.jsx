import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { nativeStackScreenOptions } from '../../../navigation/nativeStackScreenOptions';
import { ROUTES } from '../../../routes/routes';
import { useTheme } from '../../../theme';
import { SubscriptionDetailScreen } from '../../subscriptions';
import { CustomerDetailsScreen } from '../screens/CustomerDetailsScreen';
import { CustomersScreen } from '../screens/CustomersScreen';
import { MaintenanceInviteScreen } from '../maintenance-invite/screens/MaintenanceInviteScreen';

const Stack = createNativeStackNavigator();

export function CustomersNavigator() {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={nativeStackScreenOptions({ colors })}
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
      <Stack.Screen
        component={MaintenanceInviteScreen}
        name={ROUTES.MAINTENANCE_INVITE}
        options={{
          title: 'Maintenance offer',
          headerBackButtonDisplayMode: 'minimal',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        component={SubscriptionDetailScreen}
        name={ROUTES.SUBSCRIPTION_DETAIL}
        options={{
          headerBackButtonDisplayMode: 'minimal',
          headerBackTitleVisible: false,
        }}
      />
    </Stack.Navigator>
  );
}
