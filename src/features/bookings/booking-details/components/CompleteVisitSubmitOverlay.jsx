import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { AppText, EchoBarsLoader } from '../../../../components/ui';
import { SUBMIT_OUTCOME_SUCCESS } from '../../../../components/ui/submitOutcomeTokens';
import { useTheme } from '../../../../theme';
import { COMPLETE_VISIT_SHOW_CUSTOMER_NOTIFICATION_COPY } from '../constants/markCompleteFeatureFlags';

const enableMotion = typeof process !== 'undefined' && process.env.NODE_ENV !== 'test';

const PENDING_MESSAGES = COMPLETE_VISIT_SHOW_CUSTOMER_NOTIFICATION_COPY
  ? ['Completing', 'Sending receipt', 'Sending review link', 'Updating booking']
  : ['Completing', 'Updating booking'];
const PENDING_MESSAGE_MS = 1200;

/**
 * Full-screen pending / success overlay for the complete-visit design flow (mock submit).
 *
 * @param {{
 *   phase: 'pending' | 'success';
 *   pendingTitle?: string;
 *   successTitle: string;
 *   successDetail: string;
 *   bottomInset?: number;
 * }} props
 */
export function CompleteVisitSubmitOverlay({
  phase,
  pendingTitle = 'Completing',
  successTitle,
  successDetail,
  bottomInset = 0,
}) {
  const { colors } = useTheme();
  const [pendingMessageIndex, setPendingMessageIndex] = useState(0);
  const iconScale = useSharedValue(enableMotion ? 0.72 : 1);
  const iconOpacity = useSharedValue(enableMotion ? 0 : 1);
  const textOpacity = useSharedValue(enableMotion ? 0 : 1);
  const textTranslateY = useSharedValue(enableMotion ? 10 : 0);

  useEffect(() => {
    if (phase !== 'pending') {
      setPendingMessageIndex(0);
      return undefined;
    }

    const intervalId = setInterval(() => {
      setPendingMessageIndex((prev) => (prev + 1) % PENDING_MESSAGES.length);
    }, PENDING_MESSAGE_MS);

    return () => clearInterval(intervalId);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'success') {
      return undefined;
    }

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
  }, [iconOpacity, iconScale, phase, textOpacity, textTranslateY]);

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
    transform: [{ scale: iconScale.value }],
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  const overlayInsetStyle = { paddingBottom: bottomInset };

  if (phase === 'pending') {
    const activePendingTitle = PENDING_MESSAGES[pendingMessageIndex] ?? pendingTitle;
    return (
      <View style={[styles.root, overlayInsetStyle, { backgroundColor: colors.shell }]}>
        <View style={styles.pendingWrap}>
          <EchoBarsLoader accessibilityLabel="Completing" />
          <AppText style={[styles.pendingTitle, { color: colors.text }]}>
            {activePendingTitle}
          </AppText>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.successRoot, overlayInsetStyle, { backgroundColor: colors.shell }]}>
      <View style={styles.successWrap}>
        <Animated.View
          accessibilityLabel="Completed successfully"
          accessibilityRole="image"
          style={[
            styles.iconRing,
            { backgroundColor: SUBMIT_OUTCOME_SUCCESS.ring },
            iconAnimatedStyle,
          ]}
        >
          <Ionicons color={SUBMIT_OUTCOME_SUCCESS.color} name="checkmark-done-outline" size={56} />
        </Animated.View>
        <Animated.View style={[styles.successTextWrap, textAnimatedStyle]}>
          <AppText style={[styles.successTitle, { color: colors.text }]}>{successTitle}</AppText>
          <AppText style={[styles.successDetail, { color: colors.textMuted }]}>
            {successDetail}
          </AppText>
        </Animated.View>
      </View>
    </View>
  );
}

const SUCCESS_CONTENT_TOP = '22%';

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    paddingHorizontal: 28,
    zIndex: 10,
  },
  successRoot: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    justifyContent: 'flex-start',
    paddingHorizontal: 28,
    paddingTop: SUCCESS_CONTENT_TOP,
    zIndex: 10,
  },
  pendingWrap: {
    alignItems: 'center',
    gap: 18,
    justifyContent: 'center',
  },
  pendingTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.25,
    textAlign: 'center',
  },
  successWrap: {
    alignItems: 'center',
    gap: 24,
    justifyContent: 'flex-start',
  },
  iconRing: {
    alignItems: 'center',
    borderRadius: 999,
    height: 104,
    justifyContent: 'center',
    width: 104,
  },
  successTextWrap: {
    alignItems: 'center',
    gap: 10,
    maxWidth: 300,
    width: '100%',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  successDetail: {
    fontSize: 17,
    fontWeight: '400',
    letterSpacing: -0.1,
    lineHeight: 26,
    textAlign: 'center',
  },
});
