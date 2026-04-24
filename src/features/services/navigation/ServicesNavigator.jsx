import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ROUTES } from '../../../routes/routes';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import { ServicesScreen } from '../screens/ServicesScreen';

const Stack = createNativeStackNavigator();

export function ServicesNavigator() {
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
        component={ServicesScreen}
        name={ROUTES.SERVICES_LIST}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
