import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

const enableMotion = typeof process !== 'undefined' && process.env.NODE_ENV !== 'test';

/**
 * Throbbing live dot used on in-progress Next Up.
 */
export function NextUpLivePulse({ color, stacked = false, active = true }) {
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const ringScaleAnim = useRef(new Animated.Value(1)).current;
  const ringOpacityAnim = useRef(new Animated.Value(0.42)).current;

  useEffect(() => {
    if (!active || !enableMotion) {
      opacityAnim.setValue(1);
      ringScaleAnim.setValue(1);
      ringOpacityAnim.setValue(active ? 0.42 : 0);
      return undefined;
    }
    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(opacityAnim, {
            toValue: 0.45,
            duration: 680,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 680,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(ringScaleAnim, {
            toValue: 2.15,
            duration: 680,
            useNativeDriver: true,
          }),
          Animated.timing(ringScaleAnim, {
            toValue: 1,
            duration: 680,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(ringOpacityAnim, {
            toValue: 0,
            duration: 680,
            useNativeDriver: true,
          }),
          Animated.timing(ringOpacityAnim, {
            toValue: 0.42,
            duration: 680,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );
    loop.start();
    return () => {
      loop.stop();
    };
  }, [active, opacityAnim, ringOpacityAnim, ringScaleAnim]);

  return (
    <View style={[styles.host, stacked && styles.hostStacked]} testID="next-up-live-pulse">
      <Animated.View
        accessible={false}
        style={[
          styles.ring,
          {
            borderColor: color,
            opacity: ringOpacityAnim,
            transform: [{ scale: ringScaleAnim }],
          },
        ]}
      />
      <Animated.View
        accessible={false}
        style={[
          styles.dot,
          {
            backgroundColor: color,
            opacity: opacityAnim,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    alignItems: 'center',
    height: 24,
    justifyContent: 'center',
    marginTop: 8,
    overflow: 'visible',
    width: 24,
  },
  hostStacked: {
    marginTop: 0,
  },
  ring: {
    borderRadius: 99,
    borderWidth: 2,
    height: 12,
    position: 'absolute',
    width: 12,
  },
  dot: {
    borderRadius: 99,
    height: 12,
    width: 12,
  },
});
