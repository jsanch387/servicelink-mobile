import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Vibration, View } from 'react-native';

export const VOICE_ORB_SIZE = 58;
const WAVE_BARS = [0.42, 0.78, 1, 0.62];

const AI = {
  core: ['#3d2a7a', '#1a1238', '#0b0818'],
  glow: '#7c6cff',
  wave: '#ddd6ff',
  check: '#ede9fe',
};

export function voiceOrbHostPad(size = VOICE_ORB_SIZE) {
  return Math.round(size * 0.16);
}

const MOTION_ENABLED = typeof process === 'undefined' || process.env.NODE_ENV !== 'test';

function WaveBar({ active, color, delay, maxHeight, width }) {
  const progress = useRef(new Animated.Value(MOTION_ENABLED ? 0.45 : 0.7)).current;

  useEffect(() => {
    if (!MOTION_ENABLED) {
      progress.setValue(0.7);
      return undefined;
    }
    const peak = active ? 1 : 0.72;
    const floor = active ? 0.28 : 0.4;
    const duration = active ? 280 : 720;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(progress, {
          duration,
          easing: Easing.inOut(Easing.quad),
          toValue: peak,
          useNativeDriver: false,
        }),
        Animated.timing(progress, {
          duration,
          easing: Easing.inOut(Easing.quad),
          toValue: floor,
          useNativeDriver: false,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, delay, progress]);

  return (
    <Animated.View
      style={{
        backgroundColor: color,
        borderRadius: width / 2,
        height: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [maxHeight * 0.22, maxHeight],
        }),
        width,
      }}
    />
  );
}

function VoiceWaveform({ active, color, size }) {
  const maxHeight = Math.round(size * 0.38);
  const width = size >= 120 ? 5 : 3;
  const gap = size >= 120 ? 5 : 3;

  return (
    <View style={{ alignItems: 'center', flexDirection: 'row', gap, height: maxHeight }}>
      {WAVE_BARS.map((scale, index) => (
        <WaveBar
          key={`wave-${index}`}
          active={active}
          color={color}
          delay={index * 90}
          maxHeight={Math.max(8, Math.round(maxHeight * scale))}
          width={width}
        />
      ))}
    </View>
  );
}

/**
 * Dark AI orb — indigo core and inner waveform. No radiating rings.
 */
export function AppointmentVoiceOrb({
  onPress,
  size = VOICE_ORB_SIZE,
  listening = false,
  ready = false,
  disabled = false,
  accessibilityLabel = 'Talk to create this appointment',
  testID = 'appointment-voice-orb',
}) {
  const pressScale = useRef(new Animated.Value(1)).current;
  const breath = useRef(new Animated.Value(1)).current;
  const listenPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!MOTION_ENABLED) {
      return undefined;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, {
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          toValue: 1.08,
          useNativeDriver: true,
        }),
        Animated.timing(breath, {
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          toValue: 1,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [breath]);

  useEffect(() => {
    if (!MOTION_ENABLED || !listening) {
      listenPulse.setValue(1);
      return undefined;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(listenPulse, {
          duration: 380,
          easing: Easing.inOut(Easing.quad),
          toValue: 1.05,
          useNativeDriver: true,
        }),
        Animated.timing(listenPulse, {
          duration: 380,
          easing: Easing.inOut(Easing.quad),
          toValue: 1,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [listenPulse, listening]);

  const vibrateSoft = useCallback(() => {
    Haptics.selectionAsync().catch(() => {
      Vibration.vibrate(6);
    });
  }, []);

  const animatePress = useCallback(
    (value) => {
      Animated.spring(pressScale, {
        bounciness: 6,
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

  const hostPad = voiceOrbHostPad(size);
  const glowSize = Math.round(size * 0.56);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        host: {
          alignItems: 'center',
          height: size + hostPad,
          justifyContent: 'center',
          overflow: 'visible',
          width: size + hostPad,
        },
        lift: {
          borderRadius: size / 2,
          elevation: 16,
          height: size,
          shadowColor: AI.glow,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.7,
          shadowRadius: size >= 120 ? 26 : 16,
          width: size,
        },
        face: {
          alignItems: 'center',
          borderRadius: size / 2,
          height: size,
          justifyContent: 'center',
          overflow: 'hidden',
          width: size,
        },
        glow: {
          backgroundColor: 'rgba(124, 108, 255, 0.38)',
          borderRadius: glowSize / 2,
          height: glowSize,
          position: 'absolute',
          width: glowSize,
        },
        rim: {
          ...StyleSheet.absoluteFillObject,
          borderColor: 'rgba(196, 181, 253, 0.28)',
          borderRadius: size / 2,
          borderWidth: 1,
        },
        core: {
          alignItems: 'center',
          height: size,
          justifyContent: 'center',
          width: size,
        },
      }),
    [glowSize, hostPad, size],
  );

  return (
    <View pointerEvents="box-none" style={styles.host}>
      <Animated.View
        style={[
          styles.lift,
          { transform: [{ scale: Animated.multiply(pressScale, listenPulse) }] },
        ]}
      >
        <LinearGradient
          colors={AI.core}
          end={{ x: 0.9, y: 1 }}
          start={{ x: 0.15, y: 0 }}
          style={styles.face}
        >
          <Animated.View pointerEvents="none" style={[styles.glow, { transform: [{ scale: breath }] }]} />
          <View pointerEvents="none" style={styles.rim} />
          <Pressable
            accessibilityLabel={accessibilityLabel}
            accessibilityRole="button"
            accessibilityState={{ disabled, busy: listening }}
            disabled={disabled}
            style={styles.core}
            testID={testID}
            onPress={handlePress}
            onPressIn={() => animatePress(0.94)}
            onPressOut={() => animatePress(1)}
          >
            {ready ? (
              <Ionicons color={AI.check} name="checkmark" size={size >= 120 ? 42 : 22} />
            ) : (
              <VoiceWaveform active={listening} color={AI.wave} size={size} />
            )}
          </Pressable>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}
