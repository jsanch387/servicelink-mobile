import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { nativeStackScreenOptions } from '../../../navigation/nativeStackScreenOptions';
import { ROUTES } from '../../../routes/routes';
import { useTheme } from '../../../theme';
import { ServicesScreen } from '../screens/ServicesScreen';

const Stack = createNativeStackNavigator();

export function ServicesNavigator() {
  const { colors } = useTheme();

  return (
    <Stack.Navigator screenOptions={nativeStackScreenOptions({ colors })}>
      <Stack.Screen
        component={ServicesScreen}
        name={ROUTES.SERVICES_LIST}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
