import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { AppText } from '../../../../components/ui';
import { SUBMIT_OUTCOME_SUCCESS } from '../../../../components/ui/submitOutcomeTokens';
import { useTheme } from '../../../../theme';

const enableMotion = typeof process !== 'undefined' && process.env.NODE_ENV !== 'test';

export function AppointmentConfirmedStep() {
  const { colors } = useTheme();
  const iconScale = useSharedValue(enableMotion ? 0.72 : 1);
  const iconOpacity = useSharedValue(enableMotion ? 0 : 1);
  const textOpacity = useSharedValue(enableMotion ? 0 : 1);
  const textTranslateY = useSharedValue(enableMotion ? 10 : 0);

  useEffect(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }, []);

  useEffect(() => {
    if (!enableMotion) {
      iconScale.value = 1;
      iconOpacity.value = 1;
      textOpacity.value = 1;
      textTranslateY.value = 0;
      return undefined;
    }

    iconScale.value = 0.72;
    iconOpacity.value = 0;
    textOpacity.value = 0;
    textTranslateY.value = 10;

    iconOpacity.value = withTiming(1, { duration: 280, easing: Easing.out(Easing.cubic) });
    iconScale.value = withSpring(1, { damping: 14, stiffness: 220, mass: 0.85 });
    textOpacity.value = withDelay(
      120,
      withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) }),
    );
    textTranslateY.value = withDelay(
      120,
      withSpring(0, { damping: 16, stiffness: 240, mass: 0.9 }),
    );

    return undefined;
  }, [iconOpacity, iconScale, textOpacity, textTranslateY]);

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
    transform: [{ scale: iconScale.value }],
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 12,
        },
        iconRing: {
          alignItems: 'center',
          backgroundColor: SUBMIT_OUTCOME_SUCCESS.ring,
          borderRadius: 999,
          height: 104,
          justifyContent: 'center',
          marginBottom: 24,
          width: 104,
        },
        textWrap: {
          alignItems: 'center',
          gap: 10,
          maxWidth: 300,
        },
        title: {
          color: colors.text,
          fontSize: 24,
          fontWeight: '800',
          letterSpacing: -0.4,
          textAlign: 'center',
        },
        body: {
          color: colors.textMuted,
          fontSize: 17,
          fontWeight: '400',
          letterSpacing: -0.1,
          lineHeight: 26,
          textAlign: 'center',
        },
      }),
    [colors],
  );

  return (
    <View style={styles.wrap}>
      <Animated.View
        accessibilityLabel="Success"
        accessibilityRole="image"
        style={[styles.iconRing, iconAnimatedStyle]}
      >
        <Ionicons color={SUBMIT_OUTCOME_SUCCESS.color} name="checkmark-circle" size={56} />
      </Animated.View>
      <Animated.View style={[styles.textWrap, textAnimatedStyle]}>
        <AppText style={styles.title}>Appointment confirmed</AppText>
        <AppText style={styles.body}>
          You’re all set—it’s on your calendar. Check Bookings for details.
        </AppText>
      </Animated.View>
    </View>
  );
}
