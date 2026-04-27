import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';

/**
 * @typedef {'md' | 'sm' | 'none'} CardPadding
 */

const SURFACE_PADDING = StyleSheet.create({
  md: {
    paddingHorizontal: 18,
    paddingVertical: 20,
  },
  sm: {
    padding: 10,
  },
  none: {},
});

/**
 * Flat panel using `cardSurface` with optional outline.
 */
export function SurfaceCard({ children, style, padding = 'md', outlined = true, ...rest }) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.surface,
        SURFACE_PADDING[padding],
        { backgroundColor: colors.cardSurface },
        outlined && { borderColor: colors.border, borderWidth: 1 },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

/**
 * High-contrast elevated card (e.g. “Next up”) — uses `nextUpSurface` + shadow.
 */
export function SpotlightCard({ children, style, ...rest }) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.spotlight,
        {
          backgroundColor: colors.nextUpSurface,
          shadowColor: '#000',
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  surface: {
    borderRadius: 16,
  },
  spotlight: {
    borderRadius: 18,
    elevation: 10,
    padding: 16,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
  },
});
