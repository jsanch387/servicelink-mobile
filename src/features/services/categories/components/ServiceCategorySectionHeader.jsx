import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../../components/ui';
import { useTheme } from '../../../../theme';

/** Section header for vertically grouped service lists (booking link / future layouts). */
export function ServiceCategorySectionHeader({ name, countLabel }) {
  const { colors } = useTheme();

  return (
    <View style={styles.wrap}>
      <View style={styles.titleRow}>
        <AppText style={[styles.title, { color: colors.text }]}>{name}</AppText>
        <AppText style={[styles.count, { color: colors.textMuted }]}>{countLabel}</AppText>
      </View>
      <View style={[styles.divider, { backgroundColor: colors.border }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 12,
    marginTop: 4,
  },
  titleRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginRight: 8,
  },
  count: {
    fontSize: 13,
    fontWeight: '500',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
});
