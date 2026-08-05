import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import { AppText } from '../../../components/ui';
import { useTheme } from '../../../theme';
import { fireSuccessHaptic } from '../../../utils/feedbackHaptics';

const MOTION_ENABLED = typeof process === 'undefined' || process.env.NODE_ENV !== 'test';

/**
 * Brief “ahh” flash after the owner completes a coach tip via the real CTA.
 *
 * @param {{
 *   label: string;
 *   color: string;
 *   onDone: () => void;
 * }} props
 */
export function NextUpCoachWinFlash({ label, color, onDone }) {
  const { colors, isDark } = useTheme();
  const anim = useRef(new Animated.Value(MOTION_ENABLED ? 0 : 1)).current;

  useEffect(() => {
    fireSuccessHaptic();
    if (!MOTION_ENABLED) {
      return undefined;
    }
    anim.setValue(0);
    Animated.sequence([
      Animated.spring(anim, {
        toValue: 1,
        friction: 6,
        tension: 120,
        useNativeDriver: true,
      }),
      Animated.delay(700),
      Animated.timing(anim, {
        toValue: 0,
        duration: 220,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        onDone();
      }
    });
  }, [anim, onDone]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          alignItems: 'center',
          alignSelf: 'center',
          backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(10,10,10,0.06)',
          borderColor: color,
          borderRadius: 999,
          borderWidth: 1.5,
          flexDirection: 'row',
          gap: 6,
          marginBottom: 10,
          paddingHorizontal: 14,
          paddingVertical: 8,
        },
        label: {
          color: colors.nextUpText ?? colors.text,
          fontSize: 14,
          fontWeight: '800',
          letterSpacing: -0.2,
        },
      }),
    [color, colors, isDark],
  );

  return (
    <Animated.View
      accessibilityLiveRegion="polite"
      style={[
        styles.root,
        {
          opacity: anim,
          transform: [
            {
              scale: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.85, 1],
              }),
            },
          ],
        },
      ]}
      testID="next-up-coach-win"
    >
      <Ionicons color={color} name="checkmark-circle" size={18} />
      <AppText style={styles.label}>{label}</AppText>
    </Animated.View>
  );
}
