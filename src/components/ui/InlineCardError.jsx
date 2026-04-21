import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme';

/** Compact error copy inside a card (home sections, lists). */
export function InlineCardError({ message }) {
  const { colors, isDark } = useTheme();
  if (!message?.trim()) {
    return null;
  }
  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      style={[
        styles.wrap,
        {
          backgroundColor: isDark ? 'rgba(248, 113, 113, 0.1)' : 'rgba(220, 38, 38, 0.07)',
          borderColor: colors.danger,
        },
      ]}
    >
      <Text style={[styles.text, { color: colors.danger }]}>{message.trim()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
});
