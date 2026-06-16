import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  PanResponder,
  Platform,
  StyleSheet,
  Vibration,
  View,
} from 'react-native';
import { AppText } from './AppText';
import { EchoBarsLoader } from './EchoBarsLoader';

const TRACK_HEIGHT = 56;
const TRACK_INSET = 4;
const THUMB_HEIGHT = TRACK_HEIGHT - TRACK_INSET * 2;
const THUMB_WIDTH = 56;
const THUMB_HIT_SLOP = 10;
const COMPLETE_RATIO = 0.72;
const enableMotion = typeof process !== 'undefined' && process.env.NODE_ENV !== 'test';

/**
 * Slide-to-confirm control for starting an on-site job — action-dashboard feel with haptic ticks.
 *
 * @param {object} props
 * @param {() => void} props.onComplete
 * @param {boolean} [props.disabled]
 * @param {boolean} [props.loading]
 * @param {string} [props.label]
 * @param {string} [props.accessibilityLabel]
 * @param {'light' | 'dark'} [props.surfaceTone] Matches Next Up card face (`light` = white card).
 */
export function SlideToStartJob({
  onComplete,
  disabled = false,
  loading = false,
  label = 'Slide to start job',
  accessibilityLabel = 'Start job',
  surfaceTone = 'light',
}) {
  const isDarkFace = surfaceTone === 'dark';
  const palette = useMemo(
    () =>
      isDarkFace
        ? {
            track: 'rgba(255,255,255,0.08)',
            trackBorder: 'rgba(255,255,255,0.14)',
            fill: 'rgba(52, 211, 153, 0.28)',
            label: 'rgba(250,250,250,0.72)',
            thumbBg: '#fafafa',
            thumbIcon: '#0a0a0a',
            loader: '#fafafa',
          }
        : {
            track: 'rgba(10,10,10,0.06)',
            trackBorder: 'rgba(10,10,10,0.1)',
            fill: 'rgba(5, 150, 105, 0.18)',
            label: 'rgba(10,10,10,0.52)',
            thumbBg: '#0a0a0a',
            thumbIcon: '#ffffff',
            loader: '#ffffff',
          },
    [isDarkFace],
  );

  const [trackWidth, setTrackWidth] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [completed, setCompleted] = useState(false);
  const dragX = useRef(new Animated.Value(0)).current;
  const labelOpacity = useRef(new Animated.Value(1)).current;
  const chevronShift = useRef(new Animated.Value(0)).current;
  const dragStartRef = useRef(0);
  const maxDragRef = useRef(0);
  const busyRef = useRef(false);
  const lastHapticStep = useRef(-1);
  const busy = disabled || loading || completed;

  const maxDrag = Math.max(0, trackWidth - THUMB_WIDTH - TRACK_INSET * 2);
  maxDragRef.current = maxDrag;
  busyRef.current = busy;

  const resetThumb = useCallback(() => {
    Animated.timing(dragX, {
      toValue: 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    Animated.timing(labelOpacity, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();
    lastHapticStep.current = -1;
  }, [dragX, labelOpacity]);

  const fireComplete = useCallback(() => {
    if (busyRef.current) {
      return;
    }
    setCompleted(true);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    if (Platform.OS === 'android') {
      Vibration.vibrate(42);
    }
    onComplete?.();
    Animated.timing(dragX, {
      toValue: maxDragRef.current,
      duration: 160,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [dragX, onComplete]);

  const maybeHapticTick = useCallback((progress) => {
    const step = Math.floor(progress * 8);
    if (step > lastHapticStep.current) {
      lastHapticStep.current = step;
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !busyRef.current && maxDragRef.current > 0,
      onStartShouldSetPanResponderCapture: () => !busyRef.current && maxDragRef.current > 0,
      onMoveShouldSetPanResponder: (_, gesture) =>
        !busyRef.current &&
        maxDragRef.current > 0 &&
        Math.abs(gesture.dx) > 2 &&
        Math.abs(gesture.dx) >= Math.abs(gesture.dy),
      onMoveShouldSetPanResponderCapture: (_, gesture) =>
        !busyRef.current &&
        maxDragRef.current > 0 &&
        Math.abs(gesture.dx) > 2 &&
        Math.abs(gesture.dx) >= Math.abs(gesture.dy),
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        dragX.stopAnimation((value) => {
          dragStartRef.current = value;
        });
        labelOpacity.stopAnimation();
        setDragging(true);
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      },
      onPanResponderMove: (_, gesture) => {
        const max = maxDragRef.current;
        const next = Math.min(Math.max(dragStartRef.current + gesture.dx, 0), max);
        dragX.setValue(next);
        const progress = max > 0 ? next / max : 0;
        labelOpacity.setValue(1 - progress * 0.85);
        maybeHapticTick(progress);
      },
      onPanResponderRelease: (_, gesture) => {
        setDragging(false);
        const max = maxDragRef.current;
        const next = Math.min(Math.max(dragStartRef.current + gesture.dx, 0), max);
        const ratio = max > 0 ? next / max : 0;
        const flickComplete = gesture.vx > 0.45 && ratio >= 0.45;
        if (max > 0 && (ratio >= COMPLETE_RATIO || flickComplete)) {
          fireComplete();
          return;
        }
        resetThumb();
      },
      onPanResponderTerminate: () => {
        setDragging(false);
        resetThumb();
      },
    }),
  ).current;

  useEffect(() => {
    if (!enableMotion || busy) {
      chevronShift.setValue(0);
      return undefined;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(chevronShift, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(chevronShift, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [busy, chevronShift]);

  const handleAccessibilityActivate = useCallback(() => {
    fireComplete();
  }, [fireComplete]);

  const fillWidth = dragX.interpolate({
    inputRange: [0, Math.max(maxDrag, 1)],
    outputRange: [0, Math.max(maxDrag, 1)],
    extrapolate: 'clamp',
  });

  const chevronTranslate = chevronShift.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 5],
  });

  return (
    <View style={styles.wrap}>
      <View
        accessibilityActions={[{ name: 'activate', label: accessibilityLabel }]}
        accessibilityHint="Slide the control to the right to start the job"
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="adjustable"
        accessibilityState={{ disabled: busy, busy: loading }}
        onAccessibilityAction={(event) => {
          if (event.nativeEvent.actionName === 'activate') {
            handleAccessibilityActivate();
          }
        }}
        onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
        style={[
          styles.track,
          {
            backgroundColor: palette.track,
            borderColor: palette.trackBorder,
            opacity: disabled ? 0.55 : 1,
          },
        ]}
        testID="slide-to-start-job-track"
      >
        <Animated.View
          pointerEvents="none"
          style={[
            styles.fill,
            {
              backgroundColor: palette.fill,
              width: fillWidth,
            },
          ]}
        />

        <Animated.View pointerEvents="none" style={[styles.labelWrap, { opacity: labelOpacity }]}>
          <AppText style={[styles.label, { color: palette.label }]}>{label}</AppText>
        </Animated.View>

        {loading ? (
          <View pointerEvents="none" style={styles.loadingOverlay}>
            <EchoBarsLoader accessibilityLabel="Starting job" color={palette.loader} size="large" />
          </View>
        ) : null}

        <Animated.View
          collapsable={false}
          style={[
            styles.thumbHitArea,
            {
              left: TRACK_INSET - THUMB_HIT_SLOP,
              top: TRACK_INSET - THUMB_HIT_SLOP,
              transform: [{ translateX: dragX }],
            },
          ]}
          testID="slide-to-start-job-thumb"
          {...(!busy ? panResponder.panHandlers : {})}
        >
          <View
            style={[
              styles.thumb,
              {
                backgroundColor: palette.thumbBg,
                shadowOpacity: dragging ? 0.28 : 0.16,
              },
            ]}
          >
            <Animated.View
              style={[styles.thumbChevrons, { transform: [{ translateX: chevronTranslate }] }]}
            >
              <Ionicons color={palette.thumbIcon} name="chevron-forward" size={16} />
              <Ionicons
                color={palette.thumbIcon}
                name="chevron-forward"
                size={16}
                style={styles.chevronTight}
              />
            </Animated.View>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'stretch',
    width: '100%',
  },
  track: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    height: TRACK_HEIGHT,
    justifyContent: 'center',
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    borderRadius: 12,
    bottom: TRACK_INSET,
    left: TRACK_INSET,
    position: 'absolute',
    top: TRACK_INSET,
  },
  labelWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: THUMB_WIDTH + 12,
    paddingRight: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  chevronTight: {
    marginLeft: -10,
  },
  thumbChevrons: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.08)',
    justifyContent: 'center',
  },
  thumbHitArea: {
    padding: THUMB_HIT_SLOP,
    position: 'absolute',
    zIndex: 2,
  },
  thumb: {
    alignItems: 'center',
    borderRadius: 12,
    elevation: 4,
    height: THUMB_HEIGHT,
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    width: THUMB_WIDTH,
  },
});
