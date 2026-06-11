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
const BAR_WIDTH = 5;
const BAR_HEIGHT = 15;
const BAR_GAP = 10;
const STAGGER_MS = 110;
const PULSE_MS = 400;

const PULSE_UP = { duration: PULSE_MS, easing: Easing.inOut(Easing.ease) };
const PULSE_DOWN = { duration: PULSE_MS, easing: Easing.inOut(Easing.ease) };

function EchoBar({ index, color }) {
  const progress = useSharedValue(0);
  const enableMotion = typeof process !== 'undefined' && process.env.NODE_ENV !== 'test';

  useEffect(() => {
    if (!enableMotion) {
      progress.value = 0.5;
      return undefined;
    }
    progress.value = withDelay(
      index * STAGGER_MS,
      withRepeat(withSequence(withTiming(1, PULSE_UP), withTiming(0, PULSE_DOWN)), -1, false),
    );
    return undefined;
  }, [enableMotion, index, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.22 + progress.value * 0.78,
  }));

  return (
    <View style={styles.barSlot}>
      <Animated.View style={[styles.bar, { backgroundColor: color }, animatedStyle]} />
    </View>
  );
}

/**
 * Echo bars loader — same-height pills with a left-to-right opacity wave.
 *
 * @param {{ accessibilityLabel?: string; color?: string }} props
 *   `color` overrides the default muted bar color (e.g. white on a dark button).
 */
export function EchoBarsLoader({ accessibilityLabel = 'Loading', color }) {
  const { colors } = useTheme();
  const barColor = color ?? colors.textMuted;

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="progressbar"
      style={styles.wrap}
    >
      {Array.from({ length: BAR_COUNT }, (_, index) => (
        <EchoBar key={`echo-bar-${index}`} color={barColor} index={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: BAR_GAP,
    height: BAR_HEIGHT,
    justifyContent: 'center',
  },
  barSlot: {
    alignItems: 'center',
    height: BAR_HEIGHT,
    justifyContent: 'center',
    width: BAR_WIDTH,
  },
  bar: {
    borderRadius: BAR_HEIGHT / 2,
    height: BAR_HEIGHT,
    maxHeight: BAR_HEIGHT,
    minHeight: BAR_HEIGHT,
    width: BAR_WIDTH,
    maxWidth: BAR_WIDTH,
    minWidth: BAR_WIDTH,
  },
});
