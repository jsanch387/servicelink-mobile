import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ROUTES } from '../../../routes/routes';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import { ServicesScreen } from '../../services';
import { ServiceEditScreen } from '../../services/screens/ServiceEditScreen';
import { MoreScreen } from '../screens/MoreScreen';

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
    </Stack.Navigator>
  );
}
