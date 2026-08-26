import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';

const MOTION_ENABLED = typeof process === 'undefined' || process.env.NODE_ENV !== 'test';

/**
 * Expanding green halo + rings behind the home create FAB.
 */
export function CreateMenuFabGlow({ active, color, size = 56 }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!MOTION_ENABLED || !active) {
      pulse.setValue(0);
      return undefined;
    }
    pulse.setValue(0);
    const loop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 1900,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [active, pulse]);

  if (!active) {
    return null;
  }

  return (
    <>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.halo,
          {
            backgroundColor: color,
            borderRadius: size / 2,
            height: size,
            opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.32, 0] }),
            transform: [
              { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1.05, 1.55] }) },
            ],
            width: size,
          },
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.ring,
          {
            borderColor: color,
            borderRadius: size / 2,
            height: size,
            opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.58, 0] }),
            transform: [
              { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.78] }) },
            ],
            width: size,
          },
        ]}
        testID="create-menu-fab-glow"
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.ring,
          {
            borderColor: color,
            borderRadius: size / 2,
            height: size,
            opacity: pulse.interpolate({
              inputRange: [0, 0.22, 1],
              outputRange: [0, 0.4, 0],
            }),
            transform: [
              { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 2.12] }) },
            ],
            width: size,
          },
        ]}
      />
    </>
  );
}

const styles = StyleSheet.create({
  halo: {
    position: 'absolute',
  },
  ring: {
    borderWidth: 2,
    position: 'absolute',
  },
});
