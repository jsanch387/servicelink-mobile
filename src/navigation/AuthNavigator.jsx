import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { PushNotificationsBootstrap } from '../features/notifications/components/PushNotificationsBootstrap';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, StyleSheet, View } from 'react-native';
import { AppFontLoadingShell } from '../components/ui';
import { useAuth } from '../features/auth';
import { ForgotPasswordScreen } from '../features/auth/screens/ForgotPasswordScreen';
import { LoginScreen } from '../features/auth/screens/LoginScreen';
import { SignUpScreen } from '../features/auth/screens/SignUpScreen';
import { CheckYourEmailScreen } from '../features/auth/screens/CheckYourEmailScreen';
import { OnboardingScreen, useOnboardingGate } from '../features/onboarding';
import { PENDING_NAVIGATE_TO_BOOKING_LINK_KEY } from '../features/onboarding/constants/postOnboardingNavigation';
import { CreateAppointmentScreen } from '../features/bookings';
import { NotificationsInboxScreen } from '../features/notifications/screens/NotificationsInboxScreen';
import { CreateQuoteScreen } from '../features/quotes/screens/CreateQuoteScreen';
import { useSubscription } from '../features/subscription';
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
  const { isLoading } = useSubscription();

  const mainAppSubscriptionBooting = Boolean(session && !needsOnboarding && user?.id) && isLoading;

  const mainTabsInteractive =
    Boolean(session && user?.id) && !needsOnboarding && !mainAppSubscriptionBooting;

  const handoffOverlayOpacity = useRef(new Animated.Value(1)).current;
  const handoffDismissStartedRef = useRef(false);

  /** After step 5 activation: stay covered until tabs are ready so subscription boot / logo doesn’t flash, then fade out. */
  useEffect(() => {
    if (!session || !postActivationHandoff) {
      handoffDismissStartedRef.current = false;
      handoffOverlayOpacity.setValue(1);
      return undefined;
    }
    if (needsOnboarding) {
      return undefined;
    }

    let cancelled = false;
    let settleTimerId;
    let failsafeTimerId;

    const dismissWithFade = () => {
      if (cancelled || handoffDismissStartedRef.current) {
        return;
      }
      handoffDismissStartedRef.current = true;
      Animated.timing(handoffOverlayOpacity, {
        toValue: 0,
        duration: 340,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished || cancelled) {
          handoffDismissStartedRef.current = false;
          return;
        }
        endPostActivationHandoff();
        handoffOverlayOpacity.setValue(1);
        handoffDismissStartedRef.current = false;
      });
    };

    const scheduleDismiss = (delayMs) => {
      return setTimeout(() => {
        if (!cancelled) {
          dismissWithFade();
        }
      }, delayMs);
    };

    if (mainTabsInteractive) {
      // Pending booking-link nav retries at 120 / 450 / 900 ms — stay covered through the 450 ms pass.
      settleTimerId = scheduleDismiss(520);
    } else {
      failsafeTimerId = setTimeout(() => {
        if (!cancelled) {
          dismissWithFade();
        }
      }, 12_000);
    }

    return () => {
      cancelled = true;
      if (settleTimerId) {
        clearTimeout(settleTimerId);
      }
      if (failsafeTimerId) {
        clearTimeout(failsafeTimerId);
      }
    };
  }, [
    session,
    postActivationHandoff,
    needsOnboarding,
    mainTabsInteractive,
    endPostActivationHandoff,
    handoffOverlayOpacity,
  ]);

  /** Post–step 5: `MainTabNavigator` may not mount during subscription boot — consume pending nav here. */
  const pendingBookingLinkNavBusyRef = useRef(false);
  useEffect(() => {
    if (!mainTabsInteractive) {
      return undefined;
    }
    let cancelled = false;

    const tryConsumePendingBookingLinkNav = async () => {
      if (cancelled || pendingBookingLinkNavBusyRef.current) {
        return;
      }
      try {
        const v = await AsyncStorage.getItem(PENDING_NAVIGATE_TO_BOOKING_LINK_KEY);
        if (cancelled || v !== '1') {
          return;
        }
        if (!navigationRef.isReady()) {
          return;
        }
        pendingBookingLinkNavBusyRef.current = true;
        try {
          navigationRef.navigate(ROUTES.MAIN_APP, {
            screen: ROUTES.MORE,
            params: { screen: ROUTES.BOOKING_LINK },
          });
          await AsyncStorage.removeItem(PENDING_NAVIGATE_TO_BOOKING_LINK_KEY);
        } finally {
          pendingBookingLinkNavBusyRef.current = false;
        }
      } catch {
        pendingBookingLinkNavBusyRef.current = false;
      }
    };

    void tryConsumePendingBookingLinkNav();
    const t1 = setTimeout(() => void tryConsumePendingBookingLinkNav(), 120);
    const t2 = setTimeout(() => void tryConsumePendingBookingLinkNav(), 450);
    const t3 = setTimeout(() => void tryConsumePendingBookingLinkNav(), 900);
    return () => {
      cancelled = true;
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [mainTabsInteractive]);

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

  useEffect(() => {
    if (boot) {
      return;
    }
    void SplashScreen.hideAsync();
  }, [boot]);

  const stackKey = session
    ? needsOnboarding
      ? 'onboarding'
      : mainAppSubscriptionBooting
        ? 'main-subscription-boot'
        : 'main'
    : 'auth';

  if (boot) {
    return <AppFontLoadingShell accessibilityLabel="Loading" animateEntrance testID="auth-boot" />;
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
          {session && !needsOnboarding && !mainAppSubscriptionBooting ? (
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
              <Stack.Screen component={CheckYourEmailScreen} name={ROUTES.CHECK_YOUR_EMAIL} />
              <Stack.Screen component={ForgotPasswordScreen} name={ROUTES.FORGOT_PASSWORD} />
            </>
          ) : null}
        </Stack.Navigator>
      </NavigationContainer>
      {session && postActivationHandoff ? (
        <Animated.View
          accessibilityLabel="Finishing setup"
          pointerEvents="auto"
          style={[
            StyleSheet.absoluteFillObject,
            {
              alignItems: 'center',
              backgroundColor: colors.shell,
              elevation: 32,
              justifyContent: 'center',
              zIndex: 9999,
              opacity: handoffOverlayOpacity,
            },
          ]}
        >
          <ActivityIndicator accessibilityLabel="Loading" color={colors.accent} size="large" />
        </Animated.View>
      ) : null}
    </View>
  );
}
