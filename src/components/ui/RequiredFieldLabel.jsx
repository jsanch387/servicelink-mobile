import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';
import { AppText } from './AppText';

const styles = StyleSheet.create({
  row: {
    alignItems: 'baseline',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});

export function RequiredFieldLabel({ text, compact = false }) {
  const { colors } = useTheme();
  const typography = compact
    ? { fontSize: 13, fontWeight: '600' }
    : { fontSize: 14, fontWeight: '500' };

  return (
    <View style={styles.row}>
      <AppText style={[typography, { color: colors.textMuted }]}>{text}</AppText>
      <AppText accessibilityLabel="required" style={[typography, { color: colors.danger }]}>
        {' *'}
      </AppText>
    </View>
  );
}
