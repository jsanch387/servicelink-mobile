import { useCallback, useMemo, useRef } from 'react';
import { Animated, Dimensions } from 'react-native';

function slideDistance() {
  return Math.ceil(Dimensions.get('window').height);
}

const useInstantSheetAnim = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';

/**
 * Drives a bottom sheet: backdrop fades in/out while the sheet translates on Y.
 * Use with `Modal` `animationType="none"` so RN does not slide the whole layer.
 */
export function useModalFadeBackdropSlideSheet() {
  const slideDist = useMemo(() => slideDistance(), []);
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(slideDist)).current;

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
      Animated.spring(sheetTranslateY, {
        toValue: 0,
        friction: 9,
        tension: 68,
        useNativeDriver: true,
      }),
    ]).start();
  }, [backdropOpacity, sheetTranslateY]);

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
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(sheetTranslateY, {
          toValue: slideDist,
          duration: 280,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished && onFinished) onFinished();
      });
    },
    [backdropOpacity, sheetTranslateY, slideDist],
  );

  const backdropStyle = useMemo(() => ({ opacity: backdropOpacity }), [backdropOpacity]);
  const sheetStyle = useMemo(
    () => ({ transform: [{ translateY: sheetTranslateY }] }),
    [sheetTranslateY],
  );

  return { prepareOpen, runOpen, runClose, backdropStyle, sheetStyle };
}
