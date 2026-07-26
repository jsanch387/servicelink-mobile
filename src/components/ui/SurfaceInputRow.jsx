import { useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { FONT_FAMILIES, useTheme } from '../../theme';

/**
 * `cardSurface` row shell for inline inputs (matches customers search bar).
 * Pass a leading node, `children` (typically `AppTextInput` with `flex: 1`), and optional `right`.
 */
export function SurfaceInputRow({ left, right, children, style }) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          alignItems: 'center',
          backgroundColor: colors.cardSurface,
          borderRadius: 16,
          flexDirection: 'row',
          minHeight: 48,
          overflow: 'hidden',
          paddingHorizontal: 10,
          paddingVertical: 2,
        },
      }),
    [colors],
  );

  return (
    <View style={[styles.wrap, style]}>
      {left}
      {children}
      {right}
    </View>
  );
}

/**
 * Shared `AppTextInput` styles inside `SurfaceInputRow`.
 * Use an explicit Plus Jakarta weight — `fontWeight` on a custom `fontFamily` clips
 * iOS placeholders into white “dots” until the user starts typing.
 */
export function useSurfaceInputTextStyle() {
  const { colors } = useTheme();
  return useMemo(
    () => ({
      color: colors.inputText ?? colors.text,
      flex: 1,
      fontFamily: FONT_FAMILIES.medium,
      fontSize: 16,
      lineHeight: 22,
      margin: 0,
      minHeight: 44,
      paddingBottom: Platform.select({ ios: 11, android: 10 }),
      paddingLeft: 6,
      paddingRight: 4,
      paddingTop: Platform.select({ ios: 11, android: 10 }),
      ...Platform.select({
        android: {
          includeFontPadding: false,
          textAlignVertical: 'center',
        },
        default: {},
      }),
    }),
    [colors],
  );
}
