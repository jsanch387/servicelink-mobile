import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { PushNotificationsBootstrap } from '../features/notifications/components/PushNotificationsBootstrap';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { AppFontLoadingShell } from '../components/ui/AppFontLoadingShell';
import { useAuth } from '../features/auth';
import { ForgotPasswordScreen } from '../features/auth/screens/ForgotPasswordScreen';
import { LoginScreen } from '../features/auth/screens/LoginScreen';
import { SignUpScreen } from '../features/auth/screens/SignUpScreen';
import { OnboardingScreen, useOnboardingGate } from '../features/onboarding';
import { CreateAppointmentScreen } from '../features/bookings';
import { NotificationsInboxScreen } from '../features/notifications/screens/NotificationsInboxScreen';
import { CreateQuoteScreen } from '../features/quotes/screens/CreateQuoteScreen';
import { useSubscription } from '../features/subscription';
import { UpgradePaywallScreen } from '../features/subscription/screens/UpgradePaywallScreen';
import { shouldShowFullScreenSubscriptionPaywall } from '../features/subscription/upgradePaywallGate';
import { MainTabNavigator } from './MainTabNavigator';
import { ROUTES } from '../routes/routes';
import { FONT_FAMILIES, useTheme } from '../theme';
import { navigationRef } from './navigationRef';

const Stack = createNativeStackNavigator();

function MainAppSubscriptionBootScreen() {
  const { colors } = useTheme();
  return (
    <AppFontLoadingShell
      accessibilityLabel="Loading subscription status"
      bottomSlot={
        <ActivityIndicator
          accessibilityLabel="Loading subscription status"
          color={colors.accent}
          size="small"
          testID="subscription-boot"
        />
      }
    />
  );
}

export function AuthNavigator() {
  const { colors, isDark } = useTheme();
  const { session, isReady, user } = useAuth();
  const { needsOnboarding, isGateReady, postActivationHandoff, endPostActivationHandoff } =
    useOnboardingGate();
  const { hasProAccess, isPaywallDataStable, isLoading } = useSubscription();

  /** After activation, keep branded loader over the stack until main app has mounted, then brief hold so deep-link doesn’t flash. */
  useEffect(() => {
    if (!postActivationHandoff || needsOnboarding) {
      return undefined;
    }
    const id = setTimeout(() => {
      endPostActivationHandoff();
    }, 700);
    return () => clearTimeout(id);
  }, [postActivationHandoff, needsOnboarding, endPostActivationHandoff]);

  const isPaywallBlocking =
    Boolean(session && !needsOnboarding) &&
    shouldShowFullScreenSubscriptionPaywall({ isPaywallDataStable, hasProAccess });

  const mainAppSubscriptionBooting =
    Boolean(session && !needsOnboarding && user?.id) && isLoading && !isPaywallBlocking;

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

  const boot = !isReady || (session && !isGateReady);

  const stackKey = session
    ? needsOnboarding
      ? 'onboarding'
      : isPaywallBlocking
        ? 'main-paywall'
        : mainAppSubscriptionBooting
          ? 'main-subscription-boot'
          : 'main'
    : 'auth';

  if (boot) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.shell }}>
        <AppFontLoadingShell accessibilityLabel="Loading" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.shell }}>
      <NavigationContainer ref={navigationRef} theme={navTheme}>
        <PushNotificationsBootstrap />
        <Stack.Navigator
          key={stackKey}
          screenOptions={{
            animation: stackKey === 'auth' ? 'fade' : 'slide_from_right',
            contentStyle: { backgroundColor: colors.shell },
            headerShown: false,
          }}
        >
          {session && needsOnboarding ? (
            <Stack.Screen
              component={OnboardingScreen}
              name={ROUTES.ONBOARDING}
              options={{ gestureEnabled: false }}
            />
          ) : null}
          {session && !needsOnboarding && mainAppSubscriptionBooting ? (
            <Stack.Screen
              component={MainAppSubscriptionBootScreen}
              name="MainAppSubscriptionBoot"
            />
          ) : null}
          {session && !needsOnboarding && !mainAppSubscriptionBooting && isPaywallBlocking ? (
            <Stack.Screen
              component={UpgradePaywallScreen}
              name={ROUTES.UPGRADE_PAYWALL}
              options={{ gestureEnabled: false }}
            />
          ) : null}
          {session && !needsOnboarding && !mainAppSubscriptionBooting && !isPaywallBlocking ? (
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
              <Stack.Screen
                component={CreateQuoteScreen}
                name={ROUTES.CREATE_QUOTE}
                options={{
                  headerShown: true,
                  headerBackButtonDisplayMode: 'minimal',
                  headerBackTitleVisible: false,
                  headerTitleStyle: {
                    fontFamily: FONT_FAMILIES.semibold,
                  },
                }}
              />
            </>
          ) : null}
          {!session ? (
            <>
              <Stack.Screen component={LoginScreen} name={ROUTES.LOGIN} />
              <Stack.Screen component={SignUpScreen} name={ROUTES.SIGN_UP} />
              <Stack.Screen component={ForgotPasswordScreen} name={ROUTES.FORGOT_PASSWORD} />
            </>
          ) : null}
        </Stack.Navigator>
      </NavigationContainer>
      {session && postActivationHandoff ? (
        <View
          pointerEvents="auto"
          style={[
            StyleSheet.absoluteFillObject,
            {
              backgroundColor: colors.shell,
              elevation: 32,
              zIndex: 9999,
            },
          ]}
        >
          <AppFontLoadingShell accessibilityLabel="Loading" />
        </View>
      ) : null}
    </View>
  );
}
