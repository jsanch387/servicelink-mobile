import { Ionicons } from '@expo/vector-icons';
import { SymbolView } from 'expo-symbols';
import { Platform, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';

const CLOSE_SIZE = 30;

/**
 * System-style sheet dismiss control.
 * iOS: SF Symbol `xmark.circle.fill`. Elsewhere: Ionicons close-circle.
 *
 * @param {object} props
 * @param {() => void} props.onPress
 * @param {string} [props.accessibilityLabel]
 */
export function SheetCloseButton({ onPress, accessibilityLabel = 'Close' }) {
  const { isDark } = useTheme();
  const tint = isDark ? 'rgba(235, 235, 245, 0.36)' : 'rgba(60, 60, 67, 0.3)';
  const fallback = <Ionicons color={tint} name="close-circle" size={CLOSE_SIZE} />;

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      hitSlop={8}
      style={styles.hit}
      onPress={onPress}
    >
      {Platform.OS === 'ios' ? (
        <SymbolView
          fallback={fallback}
          name="xmark.circle.fill"
          resizeMode="scaleAspectFit"
          size={CLOSE_SIZE}
          style={styles.symbol}
          tintColor={tint}
          type="monochrome"
          weight="regular"
        />
      ) : (
        fallback
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbol: {
    height: CLOSE_SIZE,
    width: CLOSE_SIZE,
  },
});
