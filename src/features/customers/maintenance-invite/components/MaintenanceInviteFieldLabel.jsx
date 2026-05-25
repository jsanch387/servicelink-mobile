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
 * @param {{ text: string; required?: boolean; optional?: boolean }} props
 */
export function MaintenanceInviteFieldLabel({ text, required = false, optional = false }) {
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      <AppText style={{ color: colors.textMuted, fontSize: 14, fontWeight: '500' }}>{text}</AppText>
      {required ? (
        <AppText accessibilityLabel="required" style={{ color: colors.danger, fontSize: 14 }}>
          {' *'}
        </AppText>
      ) : null}
      {optional ? (
        <AppText style={{ color: colors.placeholder, fontSize: 13, fontWeight: '400' }}>
          {' (optional)'}
        </AppText>
      ) : null}
    </View>
  );
}
