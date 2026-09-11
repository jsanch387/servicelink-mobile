import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Vibration, View } from 'react-native';

export const VOICE_ORB_SIZE = 104;

const RING_SOURCE = require('../../../../../assets/images/voice-orb-ring-soft.png');

export function voiceOrbHostPad(size = VOICE_ORB_SIZE) {
  return Math.round(size * 0.2);
}

const MOTION_ENABLED = typeof process === 'undefined' || process.env.NODE_ENV !== 'test';

/**
 * Voice trigger — the reference ring, slowly spinning.
 */
export function AppointmentVoiceOrb({
  onPress,
  onPressIn,
  onPressOut,
  size = VOICE_ORB_SIZE,
  listening = false,
  ready = false,
  disabled = false,
  accessibilityLabel = 'Talk to create this appointment',
  testID = 'appointment-voice-orb',
}) {
  const pressScale = useRef(new Animated.Value(1)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    if (!MOTION_ENABLED) {
      return undefined;
    }
    spin.setValue(0);
    const loop = Animated.loop(
      Animated.timing(spin, {
        duration: listening ? 4000 : 10000,
        easing: Easing.linear,
        toValue: 1,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [listening, spin]);

  useEffect(() => {
    if (!MOTION_ENABLED) {
      glow.setValue(0.85);
      return undefined;
    }
    const peak = listening || ready ? 1 : 0.92;
    const floor = listening ? 0.72 : 0.62;
    const duration = listening ? 600 : 1800;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          duration,
          easing: Easing.inOut(Easing.sin),
          toValue: peak,
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          duration,
          easing: Easing.inOut(Easing.sin),
          toValue: floor,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [glow, listening, ready]);

  const vibrateSoft = useCallback(() => {
    Haptics.selectionAsync().catch(() => {
      Vibration.vibrate(6);
    });
  }, []);

  const animatePress = useCallback(
    (value) => {
      Animated.spring(pressScale, {
        bounciness: 5,
        speed: 24,
        toValue: value,
        useNativeDriver: true,
      }).start();
    },
    [pressScale],
  );

  const handlePress = useCallback(() => {
    if (disabled) {
      return;
    }
    vibrateSoft();
    onPress?.();
  }, [disabled, onPress, vibrateSoft]);

  const handlePressIn = useCallback(() => {
    if (disabled) {
      return;
    }
    animatePress(0.95);
    onPressIn?.();
  }, [animatePress, disabled, onPressIn]);

  const handlePressOut = useCallback(() => {
    animatePress(1);
    if (disabled) {
      return;
    }
    onPressOut?.();
  }, [animatePress, disabled, onPressOut]);

  const hostPad = voiceOrbHostPad(size);
  const host = size + hostPad;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        host: {
          alignItems: 'center',
          height: host,
          justifyContent: 'center',
          width: host,
        },
        press: {
          alignItems: 'center',
          height: host,
          justifyContent: 'center',
          width: host,
        },
        disc: {
          borderRadius: size / 2,
          height: size,
          overflow: 'hidden',
          width: size,
        },
        ring: {
          borderRadius: size / 2,
          height: size,
          width: size,
        },
      }),
    [host, size],
  );

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View pointerEvents="box-none" style={styles.host}>
      <Animated.View style={{ transform: [{ scale: pressScale }] }}>
        <Pressable
          accessibilityLabel={accessibilityLabel}
          accessibilityRole="button"
          accessibilityState={{ disabled, busy: listening }}
          disabled={disabled}
          style={styles.press}
          testID={testID}
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <View style={styles.disc}>
            <Animated.Image
              resizeMode="contain"
              source={RING_SOURCE}
              style={[styles.ring, { opacity: glow, transform: [{ rotate }] }]}
            />
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}
