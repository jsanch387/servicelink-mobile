import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../../components/ui';
import { useTheme } from '../../../../theme';

const styles = StyleSheet.create({
  row: {
    alignItems: 'baseline',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});

/**
 * Label + red required asterisk (quote wizard fields).
 * @param {{ text: string; compact?: boolean }} props
 */
export function QuoteRequiredFieldLabel({ text, compact = false }) {
  const { colors } = useTheme();
  const typo = compact ? { fontSize: 13, fontWeight: '600' } : { fontSize: 14, fontWeight: '500' };

  return (
    <View style={styles.row}>
      <AppText style={[typo, { color: colors.textMuted }]}>{text}</AppText>
      <AppText accessibilityLabel="required" style={[typo, { color: colors.danger }]}>
        {' *'}
      </AppText>
    </View>
  );
}
