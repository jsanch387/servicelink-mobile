import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Reanimated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
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

/**
 * @param {{
 *   phase: import('../constants/tapToPayCopy').TapToPayPhase;
 *   accentColor: string;
 * }} props
 */
export function TapToPayPulseVisual({ phase, accentColor }) {
  const breathe = useSharedValue(1);
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
      return undefined;
    }

    if (isReady) {
      breathe.value = withRepeat(
        withSequence(
          withTiming(1.04, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      );
      return undefined;
    }

    breathe.value = withTiming(1, { duration: 220 });
    return undefined;
  }, [breathe, isReady]);

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
    opacity: showOutcome ? 0 : 1,
    transform: [{ scale: breathe.value }],
  }));

  const outcomeStyle = useAnimatedStyle(() => ({
    opacity: outcomeOpacity.value,
    transform: [{ scale: outcomeScale.value }, { translateX: shakeX.value }],
  }));

  return (
    <View style={styles.visualStage}>
      {isPending ? (
        <EchoBarsLoader accessibilityLabel="Processing payment" color={accentColor} size="large" />
      ) : null}

      {!isPending ? (
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
    width: '100%',
  },
  visualCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
  },
  outcomeRing: {
    alignItems: 'center',
    borderRadius: 999,
    height: 96,
    justifyContent: 'center',
    width: 96,
  },
});
