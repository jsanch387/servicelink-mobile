import { useCallback, useMemo, useRef } from 'react';
import { Animated, Dimensions } from 'react-native';

function slideDistance() {
  return Math.ceil(Dimensions.get('window').height);
}

const useInstantSheetAnim = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';

/** Open on the next frame in app; run immediately in Jest so `act` stays quiet. */
export function scheduleSheetOpen(runOpen) {
  if (useInstantSheetAnim) {
    runOpen();
    return () => {};
  }
  const id = requestAnimationFrame(() => runOpen());
  return () => cancelAnimationFrame(id);
}

/** Experimental glass sheet settle (On my way confirm only for now). */
const GLASS_OPEN_SPRING = {
  damping: 20,
  mass: 1,
  stiffness: 150,
  useNativeDriver: true,
};

const GLASS_CLOSE_SPRING = {
  damping: 24,
  mass: 1,
  stiffness: 180,
  overshootClamping: true,
  useNativeDriver: true,
};

/**
 * Drives a bottom sheet: backdrop fades in/out while the sheet translates on Y.
 * Use with `Modal` `animationType="none"` so RN does not slide the whole layer.
 *
 * @param {{ motion?: 'default' | 'glass' }} [options]
 *   - `default` — legacy friction spring open + timing close (shared sheets)
 *   - `glass` — experimental snappy spring (On my way confirm only)
 */
export function useModalFadeBackdropSlideSheet({ motion = 'default' } = {}) {
  const slideDist = useMemo(() => slideDistance(), []);
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(slideDist)).current;
  const isGlassMotion = motion === 'glass';

  const prepareOpen = useCallback(() => {
    sheetTranslateY.setValue(slideDist);
    backdropOpacity.setValue(0);
  }, [slideDist, sheetTranslateY, backdropOpacity]);

  const runOpen = useCallback(() => {
    if (useInstantSheetAnim) {
      backdropOpacity.setValue(1);
      sheetTranslateY.setValue(0);
      return;
    }
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      isGlassMotion
        ? Animated.spring(sheetTranslateY, {
            toValue: 0,
            ...GLASS_OPEN_SPRING,
          })
        : Animated.spring(sheetTranslateY, {
            toValue: 0,
            friction: 9,
            tension: 68,
            useNativeDriver: true,
          }),
    ]).start();
  }, [backdropOpacity, sheetTranslateY, isGlassMotion]);

  const runClose = useCallback(
    (onFinished) => {
      if (useInstantSheetAnim) {
        backdropOpacity.setValue(0);
        sheetTranslateY.setValue(slideDist);
        onFinished?.();
        return;
      }
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: isGlassMotion ? 180 : 200,
          useNativeDriver: true,
        }),
        isGlassMotion
          ? Animated.spring(sheetTranslateY, {
              toValue: slideDist,
              ...GLASS_CLOSE_SPRING,
            })
          : Animated.timing(sheetTranslateY, {
              toValue: slideDist,
              duration: 280,
              useNativeDriver: true,
            }),
      ]).start(({ finished }) => {
        if (finished && onFinished) onFinished();
      });
    },
    [backdropOpacity, sheetTranslateY, slideDist, isGlassMotion],
  );

  const backdropStyle = useMemo(() => ({ opacity: backdropOpacity }), [backdropOpacity]);
  const sheetStyle = useMemo(
    () => ({ transform: [{ translateY: sheetTranslateY }] }),
    [sheetTranslateY],
  );

  return { prepareOpen, runOpen, runClose, backdropStyle, sheetStyle };
}
