import { useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';

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
          minHeight: 40,
          paddingHorizontal: 10,
          paddingVertical: 6,
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

/** Shared `AppTextInput` styles inside `SurfaceInputRow` (search + auth fields). */
export function useSurfaceInputTextStyle() {
  const { colors } = useTheme();
  return useMemo(
    () => ({
      color: colors.text,
      flex: 1,
      fontSize: 15,
      fontWeight: '500',
      minHeight: 36,
      paddingLeft: 6,
      paddingRight: 4,
      paddingVertical: Platform.select({ android: 6, default: 8 }),
      ...Platform.select({
        android: { includeFontPadding: false },
        default: {},
      }),
    }),
    [colors],
  );
}
