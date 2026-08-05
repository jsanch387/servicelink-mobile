import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

const MOTION_ENABLED = typeof process === 'undefined' || process.env.NODE_ENV !== 'test';

/**
 * Soft pulsing ring around the CTA the coach tip is pointing at.
 *
 * @param {{
 *   active?: boolean;
 *   color: string;
 *   children: import('react').ReactNode;
 *   style?: object;
 * }} props
 */
export function NextUpCoachTargetGlow({ active = false, color, children, style }) {
  const pulse = useRef(new Animated.Value(MOTION_ENABLED && active ? 0 : 1)).current;

  useEffect(() => {
    if (!MOTION_ENABLED || !active) {
      pulse.setValue(1);
      return undefined;
    }
    pulse.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, pulse]);

  if (!active) {
    return <View style={style}>{children}</View>;
  }

  const glowStyle = {
    borderColor: pulse.interpolate({
      inputRange: [0, 1],
      outputRange: [`${color}00`, `${color}AA`],
    }),
    shadowOpacity: pulse.interpolate({
      inputRange: [0, 1],
      outputRange: [0.05, 0.35],
    }),
  };

  return (
    <Animated.View
      style={[styles.glow, { shadowColor: color }, glowStyle, style]}
      testID="next-up-coach-target-glow"
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  glow: {
    borderRadius: 14,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
  },
});
