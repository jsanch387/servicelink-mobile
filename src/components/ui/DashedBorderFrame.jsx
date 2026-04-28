import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

/**
 * RN often fails to draw `borderStyle: 'dashed'` — especially on `Pressable`, thin fractional widths,
 * or Android. This draws a dashed rounded stroke with SVG so it works everywhere.
 *
 * @param {{
 *   borderRadius?: number;
 *   children: import('react').ReactNode;
 *   dashGap?: readonly [number, number];
 *   strokeColor: string;
 *   strokeWidth?: number;
 *   style?: import('react-native').StyleProp<import('react-native').ViewStyle>;
 * }} props
 */
export function DashedBorderFrame({
  borderRadius = 16,
  children,
  dashGap = [8, 6],
  strokeColor,
  strokeWidth = 2,
  style,
}) {
  const [layout, setLayout] = useState({ width: 0, height: 0 });

  const onLayout = useCallback((e) => {
    const { width, height } = e.nativeEvent.layout;
    setLayout((prev) =>
      prev.width === width && prev.height === height ? prev : { width, height },
    );
  }, []);

  const { width: w, height: h } = layout;
  const sw = strokeWidth;
  const inset = sw / 2;
  const rectRx = Math.max(0, borderRadius - inset);

  return (
    <View onLayout={onLayout} style={[styles.host, style]}>
      {w > 0 && h > 0 ? (
        <Svg height={h} pointerEvents="none" style={StyleSheet.absoluteFill} width={w}>
          <Rect
            fill="none"
            height={h - sw}
            rx={rectRx}
            ry={rectRx}
            stroke={strokeColor}
            strokeDasharray={dashGap}
            strokeWidth={sw}
            width={w - sw}
            x={inset}
            y={inset}
          />
        </Svg>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    overflow: 'hidden',
    position: 'relative',
  },
});
