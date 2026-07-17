import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';
import { AppText } from './AppText';

/**
 * Shared underlined footer action for incrementally revealing list history.
 *
 * @param {{
 *   label: string;
 *   accessibilityHint: string;
 *   loading?: boolean;
 *   onPress: () => void;
 * }} props
 */
export function LoadMoreLink({ label, accessibilityHint, loading = false, onPress }) {
  const { colors } = useTheme();

  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityHint={accessibilityHint}
        accessibilityLabel={label}
        accessibilityRole="button"
        accessibilityState={{ disabled: loading }}
        disabled={loading}
        hitSlop={8}
        onPress={onPress}
      >
        <AppText style={[styles.link, { color: colors.link }, loading && styles.disabled]}>
          {loading ? 'Loading…' : label}
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    marginTop: 16,
    paddingBottom: 12,
  },
  link: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.1,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  disabled: {
    opacity: 0.5,
  },
});
