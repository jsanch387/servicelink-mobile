import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTheme } from '../../theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const SUCCESS_GREEN_DARK = '#34c759';
const SUCCESS_GREEN_LIGHT = '#15803d';

/** Thick check in 24×24 viewBox. */
const CHECK_PATH = 'M5 12.5 L10 17.5 L19.5 6.5';

/**
 * Success mark — open circle (no fill), thin green ring draws on, thick green check.
 *
 * @param {{
 *   size?: number;
 *   color?: string;
 *   replayKey?: string | number;
 *   accessibilityLabel?: string;
 * }} props
 */
export function AnimatedCheckmark({
  size = 72,
  color,
  replayKey = 0,
  accessibilityLabel = 'Success',
}) {
  const { isDark } = useTheme();
  const green = color ?? (isDark ? SUCCESS_GREEN_DARK : SUCCESS_GREEN_LIGHT);
  const trackStroke = isDark ? 'rgba(52, 199, 89, 0.22)' : 'rgba(21, 128, 61, 0.2)';

  const ringProgress = useSharedValue(0);
  const checkScale = useSharedValue(0.4);
  const checkOpacity = useSharedValue(0);

  const stroke = Math.max(1.75, size * 0.035);
  const radius = (size - stroke) / 2 - 1;
  const circumference = 2 * Math.PI * radius;
  const checkBox = size * 0.5;

  useEffect(() => {
    ringProgress.value = 0;
    checkScale.value = 0.4;
    checkOpacity.value = 0;

    ringProgress.value = withTiming(1, {
      duration: 520,
      easing: Easing.out(Easing.cubic),
    });

    checkOpacity.value = withDelay(320, withTiming(1, { duration: 160 }));
    checkScale.value = withDelay(320, withSpring(1, { damping: 11, stiffness: 210, mass: 0.55 }));
  }, [checkOpacity, checkScale, replayKey, ringProgress]);

  const ringProps = useAnimatedProps(() => ({
    strokeDashoffset: interpolate(ringProgress.value, [0, 1], [circumference, 0]),
  }));

  const checkStyle = useAnimatedStyle(() => ({
    opacity: checkOpacity.value,
    transform: [{ scale: checkScale.value }],
  }));

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="image"
      style={[styles.root, { height: size, width: size }]}
    >
      <Svg height={size} pointerEvents="none" style={StyleSheet.absoluteFill} width={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          fill="none"
          r={radius}
          stroke={trackStroke}
          strokeWidth={stroke}
        />
        <AnimatedCircle
          animatedProps={ringProps}
          cx={size / 2}
          cy={size / 2}
          fill="none"
          r={radius}
          stroke={green}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeLinecap="round"
          strokeWidth={stroke}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>

      <Animated.View style={[styles.check, checkStyle]}>
        <Svg height={checkBox} viewBox="0 0 24 24" width={checkBox}>
          <Path
            d={CHECK_PATH}
            fill="none"
            stroke={green}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.85}
          />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
