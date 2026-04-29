import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { useTheme } from '../../theme';

/**
 * Neutral placeholder block for skeleton loading states.
 * @param {object} props
 * @param {number} [props.height]
 * @param {number|string} [props.width] — number (dp) or percentage string
 * @param {number} [props.borderRadius]
 * @param {string} [props.backgroundColor] — override token (e.g. spotlight card bones)
 * @param {boolean} [props.pulse] — subtle opacity pulse so loading feels alive (e.g. home screen)
 */
export function SkeletonBox({
  height = 14,
  width = '100%',
  borderRadius = 8,
  backgroundColor,
  pulse = false,
  style,
}) {
  const { colors } = useTheme();
  const bg = backgroundColor ?? colors.border;
  const opacityAnim = useRef(new Animated.Value(0.38)).current;
  const enablePulse = pulse && typeof process !== 'undefined' && process.env.NODE_ENV !== 'test';

  useEffect(() => {
    if (!enablePulse) {
      return undefined;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.62,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.32,
          duration: 750,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [enablePulse, opacityAnim]);

  const base = {
    backgroundColor: bg,
    borderRadius,
    height,
    width,
  };

  if (enablePulse) {
    return (
      <Animated.View
        style={[
          base,
          {
            opacity: opacityAnim,
          },
          style,
        ]}
      />
    );
  }

  return (
    <View
      style={[
        base,
        {
          opacity: 0.42,
        },
        style,
      ]}
    />
  );
}
