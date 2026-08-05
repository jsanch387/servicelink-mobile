import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/ui';
import { useTheme } from '../../../theme';
import { fireSelectionHaptic } from '../../../utils/feedbackHaptics';

const MOTION_ENABLED = typeof process === 'undefined' || process.env.NODE_ENV !== 'test';

/**
 * Compact coach bubble that points at the real Next Up CTA.
 * Short copy + motion — no quest framing.
 *
 * @param {{
 *   tip: {
 *     id: string;
 *     title: string;
 *     icon: import('@expo/vector-icons/Ionicons').IconProps['name'];
 *     iconColor: string;
 *     iconBackground: string;
 *   };
 *   onDismiss: () => void;
 * }} props
 */
export function NextUpCoachTip({ tip, onDismiss }) {
  const { colors, isDark } = useTheme();
  const enter = useRef(new Animated.Value(MOTION_ENABLED ? 0 : 1)).current;
  const nudge = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fireSelectionHaptic();
    if (!MOTION_ENABLED) {
      return undefined;
    }
    enter.setValue(0);
    Animated.spring(enter, {
      toValue: 1,
      friction: 7,
      tension: 90,
      useNativeDriver: true,
    }).start();

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(nudge, {
          toValue: 1,
          duration: 650,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(nudge, {
          toValue: 0,
          duration: 650,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [enter, nudge, tip.id]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          alignItems: 'center',
          alignSelf: 'stretch',
          marginBottom: 10,
        },
        bubble: {
          alignItems: 'center',
          alignSelf: 'stretch',
          backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(10,10,10,0.04)',
          borderColor: tip.iconColor,
          borderRadius: 16,
          borderWidth: 1.5,
          flexDirection: 'row',
          gap: 10,
          paddingLeft: 10,
          paddingRight: 6,
          paddingVertical: 10,
        },
        iconBadge: {
          alignItems: 'center',
          borderRadius: 11,
          height: 32,
          justifyContent: 'center',
          width: 32,
        },
        title: {
          color: colors.nextUpText ?? colors.text,
          flex: 1,
          fontSize: 14,
          fontWeight: '700',
          letterSpacing: -0.2,
          lineHeight: 18,
          minWidth: 0,
        },
        dismiss: {
          alignItems: 'center',
          height: 32,
          justifyContent: 'center',
          width: 32,
        },
        pointer: {
          marginTop: 2,
        },
      }),
    [colors, isDark, tip.iconColor],
  );

  const enterStyle = {
    opacity: enter,
    transform: [
      {
        scale: enter.interpolate({
          inputRange: [0, 1],
          outputRange: [0.94, 1],
        }),
      },
      {
        translateY: enter.interpolate({
          inputRange: [0, 1],
          outputRange: [6, 0],
        }),
      },
    ],
  };

  const nudgeStyle = {
    opacity: nudge.interpolate({
      inputRange: [0, 1],
      outputRange: [0.45, 1],
    }),
    transform: [
      {
        translateY: nudge.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 5],
        }),
      },
    ],
  };

  return (
    <Animated.View
      accessibilityRole="summary"
      style={[styles.wrap, enterStyle]}
      testID="next-up-coach-tip"
    >
      <View style={styles.bubble}>
        <View style={[styles.iconBadge, { backgroundColor: tip.iconBackground }]}>
          <Ionicons color={tip.iconColor} name={tip.icon} size={16} />
        </View>
        <AppText style={styles.title}>{tip.title}</AppText>
        <Pressable
          accessibilityHint="Dismisses this tip"
          accessibilityLabel="Skip tip"
          accessibilityRole="button"
          hitSlop={6}
          style={styles.dismiss}
          onPress={onDismiss}
        >
          <Ionicons color={colors.nextUpTextMuted ?? colors.textMuted} name="close" size={18} />
        </Pressable>
      </View>
      <Animated.View style={[styles.pointer, nudgeStyle]}>
        <Ionicons color={tip.iconColor} name="caret-down" size={16} />
      </Animated.View>
    </Animated.View>
  );
}
