import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../theme';

/** Fixed-size muted pills — opacity wave travels left → right. */
const BAR_COUNT = 5;
const PULSE_MS = 400;

const ECHO_BAR_SIZES = Object.freeze({
  default: {
    barWidth: 5,
    barHeight: 15,
    barGap: 10,
    staggerMs: 110,
  },
  large: {
    barWidth: 8,
    barHeight: 28,
    barGap: 14,
    staggerMs: 120,
  },
});

const PULSE_UP = { duration: PULSE_MS, easing: Easing.inOut(Easing.ease) };
const PULSE_DOWN = { duration: PULSE_MS, easing: Easing.inOut(Easing.ease) };

function EchoBar({ barHeight, barWidth, color, index, staggerMs }) {
  const progress = useSharedValue(0);
  const enableMotion = typeof process !== 'undefined' && process.env.NODE_ENV !== 'test';

  useEffect(() => {
    if (!enableMotion) {
      progress.value = 0.5;
      return undefined;
    }
    progress.value = withDelay(
      index * staggerMs,
      withRepeat(withSequence(withTiming(1, PULSE_UP), withTiming(0, PULSE_DOWN)), -1, false),
    );
    return undefined;
  }, [enableMotion, index, progress, staggerMs]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.22 + progress.value * 0.78,
  }));

  return (
    <View style={[styles.barSlot, { height: barHeight, width: barWidth }]}>
      <Animated.View
        style={[
          styles.bar,
          {
            backgroundColor: color,
            borderRadius: barHeight / 2,
            height: barHeight,
            maxHeight: barHeight,
            minHeight: barHeight,
            width: barWidth,
            maxWidth: barWidth,
            minWidth: barWidth,
          },
          animatedStyle,
        ]}
      />
    </View>
  );
}

/**
 * Echo bars loader — same-height pills with a left-to-right opacity wave.
 *
 * @param {{ accessibilityLabel?: string; color?: string; size?: 'default' | 'large' }} props
 *   `color` overrides the default muted bar color (e.g. white on a dark button).
 */
export function EchoBarsLoader({ accessibilityLabel = 'Loading', color, size = 'default' }) {
  const { colors } = useTheme();
  const barColor = color ?? colors.textMuted;
  const dimensions = ECHO_BAR_SIZES[size] ?? ECHO_BAR_SIZES.default;

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="progressbar"
      style={[styles.wrap, { gap: dimensions.barGap, height: dimensions.barHeight }]}
    >
      {Array.from({ length: BAR_COUNT }, (_, index) => (
        <EchoBar
          key={`echo-bar-${index}`}
          barHeight={dimensions.barHeight}
          barWidth={dimensions.barWidth}
          color={barColor}
          index={index}
          staggerMs={dimensions.staggerMs}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  barSlot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bar: {},
});
