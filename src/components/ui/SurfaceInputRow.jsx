import { useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { FONT_FAMILIES, useTheme } from '../../theme';

/**
 * `cardSurface` row shell for inline inputs (matches customers search bar).
 * Pass a leading node, `children` (typically `AppTextInput` with `flex: 1`), and optional `right`.
 *
 * Avoid `overflow: 'hidden'` here — it clips descenders (g, y, p) on iOS TextInput.
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
          minHeight: 52,
          paddingHorizontal: 12,
          paddingVertical: 0,
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
 *
 * No fixed `lineHeight` / short `height` — those clip descenders or hide empty placeholders on iOS.
 *
 * @param {{ keyboardType?: string }} [_options]
 */
export function useSurfaceInputTextStyle(_options = {}) {
  const { colors } = useTheme();

  return useMemo(
    () => ({
      color: colors.inputText ?? colors.text,
      flex: 1,
      fontFamily: FONT_FAMILIES.medium,
      fontSize: 16,
      margin: 0,
      minHeight: 52,
      paddingBottom: Platform.select({ ios: 14, android: 12 }),
      paddingLeft: 6,
      paddingRight: 4,
      paddingTop: Platform.select({ ios: 14, android: 12 }),
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
