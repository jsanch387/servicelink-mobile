import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAuth } from '../features/auth';
import { LoginScreen } from '../features/auth/screens/LoginScreen';
import { SignUpScreen } from '../features/auth/screens/SignUpScreen';
import { CreateAppointmentScreen } from '../features/bookings';
import { NotificationsInboxScreen } from '../features/notifications/screens/NotificationsInboxScreen';
import { MainTabNavigator } from './MainTabNavigator';
import { ROUTES } from '../routes/routes';
import { FONT_FAMILIES, useTheme } from '../theme';

const Stack = createNativeStackNavigator();

export function AuthNavigator() {
  const { colors, isDark } = useTheme();
  const { session, isReady } = useAuth();

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.shell,
      card: colors.shell,
      border: colors.border,
      primary: colors.accent,
      text: colors.text,
      notification: colors.accent,
    },
  };

  if (!isReady) {
    return (
      <View style={[styles.boot, { backgroundColor: colors.shell }]}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: colors.shell },
          headerShown: false,
        }}
      >
        {session ? (
          <>
            <Stack.Screen component={MainTabNavigator} name={ROUTES.MAIN_APP} />
            <Stack.Screen
              component={NotificationsInboxScreen}
              name={ROUTES.NOTIFICATIONS_INBOX}
              options={{
                headerShown: true,
                title: 'Notifications',
                headerBackButtonDisplayMode: 'minimal',
                headerBackTitleVisible: false,
                headerTitleStyle: {
                  fontFamily: FONT_FAMILIES.semibold,
                },
              }}
            />
            <Stack.Screen
              component={CreateAppointmentScreen}
              name={ROUTES.CREATE_APPOINTMENT}
              options={{
                headerShown: true,
                title: 'New appointment',
                headerBackButtonDisplayMode: 'minimal',
                headerBackTitleVisible: false,
                headerTitleStyle: {
                  fontFamily: FONT_FAMILIES.semibold,
                },
              }}
            />
          </>
        ) : (
          <>
            <Stack.Screen component={LoginScreen} name={ROUTES.LOGIN} />
            <Stack.Screen component={SignUpScreen} name={ROUTES.SIGN_UP} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  boot: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
});
