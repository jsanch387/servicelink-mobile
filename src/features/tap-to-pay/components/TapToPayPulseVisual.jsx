import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Reanimated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { EchoBarsLoader } from '../../../components/ui';
import {
  SUBMIT_OUTCOME_ERROR,
  SUBMIT_OUTCOME_SUCCESS,
} from '../../../components/ui/submitOutcomeTokens';
import { TAP_TO_PAY_VISUAL_STAGE_HEIGHT } from '../constants/tapToPayLayout';

const enableMotion = typeof process !== 'undefined' && process.env.NODE_ENV !== 'test';

const READY_RING_STAGGER_MS = 850;
const READY_RING_DURATION_MS = 2600;
const READY_RING_MAX_SCALE = 1.28;
const READY_RING_START_SCALE = 0.86;
const READY_RING_MAX_OPACITY = 0.32;
const READY_RING_SIZE = 88;
const READY_PULSE_CLIP_SIZE = 118;

/**
 * @param {import('react-native-reanimated').SharedValue<number>} scale
 * @param {import('react-native-reanimated').SharedValue<number>} opacity
 * @param {number} delayMs
 */
function startReadyRingPulse(scale, opacity, delayMs) {
  scale.value = withDelay(
    delayMs,
    withRepeat(
      withSequence(
        withTiming(READY_RING_START_SCALE, { duration: 0 }),
        withTiming(READY_RING_MAX_SCALE, {
          duration: READY_RING_DURATION_MS,
          easing: Easing.out(Easing.cubic),
        }),
      ),
      -1,
      false,
    ),
  );

  opacity.value = withDelay(
    delayMs,
    withRepeat(
      withSequence(
        withTiming(READY_RING_MAX_OPACITY, { duration: 0 }),
        withTiming(0, { duration: READY_RING_DURATION_MS, easing: Easing.out(Easing.cubic) }),
      ),
      -1,
      false,
    ),
  );
}

/**
 * @param {{
 *   accentColor: string;
 *   scale: import('react-native-reanimated').SharedValue<number>;
 *   opacity: import('react-native-reanimated').SharedValue<number>;
 * }} props
 */
function TapToPayReadyRing({ accentColor, scale, opacity }) {
  const ringStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Reanimated.View
      pointerEvents="none"
      style={[styles.visualCenter, styles.readyRing, { borderColor: accentColor }, ringStyle]}
    />
  );
}

/**
 * @param {{
 *   phase: import('../constants/tapToPayCopy').TapToPayPhase;
 *   accentColor: string;
 * }} props
 */
export function TapToPayPulseVisual({ phase, accentColor }) {
  const breathe = useSharedValue(1);
  const iconOpacity = useSharedValue(1);
  const ring1Scale = useSharedValue(READY_RING_START_SCALE);
  const ring2Scale = useSharedValue(READY_RING_START_SCALE);
  const ring3Scale = useSharedValue(READY_RING_START_SCALE);
  const ring1Opacity = useSharedValue(0);
  const ring2Opacity = useSharedValue(0);
  const ring3Opacity = useSharedValue(0);
  const outcomeScale = useSharedValue(0.72);
  const outcomeOpacity = useSharedValue(0);
  const shakeX = useSharedValue(0);

  const isReady = phase === 'ready';
  const isPending = phase === 'pending';
  const isSuccess = phase === 'success';
  const isError = phase === 'error';
  const showOutcome = isSuccess || isError;

  useEffect(() => {
    if (!enableMotion) {
      breathe.value = 1;
      iconOpacity.value = 1;
      ring1Scale.value = READY_RING_START_SCALE;
      ring2Scale.value = READY_RING_START_SCALE;
      ring3Scale.value = READY_RING_START_SCALE;
      ring1Opacity.value = 0;
      ring2Opacity.value = 0;
      ring3Opacity.value = 0;
      return undefined;
    }

    if (isReady) {
      breathe.value = 1;
      iconOpacity.value = 1;
      startReadyRingPulse(ring1Scale, ring1Opacity, 0);
      startReadyRingPulse(ring2Scale, ring2Opacity, READY_RING_STAGGER_MS);
      startReadyRingPulse(ring3Scale, ring3Opacity, READY_RING_STAGGER_MS * 2);
      return undefined;
    }

    breathe.value = withTiming(1, { duration: 220 });
    iconOpacity.value = withTiming(1, { duration: 220 });
    ring1Scale.value = withTiming(READY_RING_START_SCALE, { duration: 220 });
    ring2Scale.value = withTiming(READY_RING_START_SCALE, { duration: 220 });
    ring3Scale.value = withTiming(READY_RING_START_SCALE, { duration: 220 });
    ring1Opacity.value = withTiming(0, { duration: 220 });
    ring2Opacity.value = withTiming(0, { duration: 220 });
    ring3Opacity.value = withTiming(0, { duration: 220 });
    return undefined;
  }, [
    breathe,
    iconOpacity,
    isReady,
    ring1Opacity,
    ring1Scale,
    ring2Opacity,
    ring2Scale,
    ring3Opacity,
    ring3Scale,
  ]);

  useEffect(() => {
    if (!showOutcome) {
      outcomeScale.value = 0.72;
      outcomeOpacity.value = 0;
      shakeX.value = 0;
      return undefined;
    }

    if (!enableMotion) {
      outcomeScale.value = 1;
      outcomeOpacity.value = 1;
      return undefined;
    }

    outcomeOpacity.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) });
    outcomeScale.value = withSpring(1, { damping: 12, stiffness: 220, mass: 0.85 });

    if (isError) {
      shakeX.value = withSequence(
        withTiming(-8, { duration: 55 }),
        withTiming(8, { duration: 55 }),
        withTiming(-6, { duration: 50 }),
        withTiming(6, { duration: 50 }),
        withTiming(0, { duration: 45 }),
      );
    }

    return undefined;
  }, [isError, outcomeOpacity, outcomeScale, shakeX, showOutcome]);

  const iconStyle = useAnimatedStyle(() => ({
    opacity: showOutcome ? 0 : iconOpacity.value,
    transform: [{ scale: breathe.value }],
  }));

  const outcomeStyle = useAnimatedStyle(() => ({
    opacity: outcomeOpacity.value,
    transform: [{ scale: outcomeScale.value }, { translateX: shakeX.value }],
  }));

  return (
    <View pointerEvents="box-none" style={styles.visualStage}>
      {isPending ? (
        <EchoBarsLoader accessibilityLabel="Processing payment" color={accentColor} size="large" />
      ) : null}

      {isReady ? (
        <View pointerEvents="none" style={styles.readyPulseClip}>
          <TapToPayReadyRing accentColor={accentColor} opacity={ring1Opacity} scale={ring1Scale} />
          <TapToPayReadyRing accentColor={accentColor} opacity={ring2Opacity} scale={ring2Scale} />
          <TapToPayReadyRing accentColor={accentColor} opacity={ring3Opacity} scale={ring3Scale} />
          <View style={styles.visualCenter}>
            <MaterialCommunityIcons color={accentColor} name="contactless-payment" size={56} />
          </View>
        </View>
      ) : null}

      {!isPending && !isReady ? (
        <Reanimated.View style={[styles.visualCenter, iconStyle]}>
          <MaterialCommunityIcons color={accentColor} name="contactless-payment" size={56} />
        </Reanimated.View>
      ) : null}

      {isSuccess ? (
        <Reanimated.View style={[styles.visualCenter, outcomeStyle]}>
          <View style={[styles.outcomeRing, { backgroundColor: SUBMIT_OUTCOME_SUCCESS.ring }]}>
            <Ionicons color={SUBMIT_OUTCOME_SUCCESS.color} name="checkmark-done" size={52} />
          </View>
        </Reanimated.View>
      ) : null}

      {isError ? (
        <Reanimated.View style={[styles.visualCenter, outcomeStyle]}>
          <View style={[styles.outcomeRing, { backgroundColor: SUBMIT_OUTCOME_ERROR.ring }]}>
            <Ionicons color={SUBMIT_OUTCOME_ERROR.color} name="card-outline" size={48} />
          </View>
        </Reanimated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  visualStage: {
    alignItems: 'center',
    height: TAP_TO_PAY_VISUAL_STAGE_HEIGHT,
    justifyContent: 'center',
    overflow: 'hidden',
    width: '100%',
  },
  readyPulseClip: {
    alignItems: 'center',
    height: READY_PULSE_CLIP_SIZE,
    justifyContent: 'center',
    overflow: 'hidden',
    width: READY_PULSE_CLIP_SIZE,
  },
  visualCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
  },
  readyRing: {
    borderRadius: 999,
    borderWidth: 1.5,
    height: READY_RING_SIZE,
    width: READY_RING_SIZE,
  },
  outcomeRing: {
    alignItems: 'center',
    borderRadius: 999,
    height: 96,
    justifyContent: 'center',
    width: 96,
  },
});
