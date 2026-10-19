import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../../components/ui';
import { useTheme } from '../../../../theme';

/** Reorder-mode header only — no segment toggle or category pills above. */
export function ServiceReorderHeaderBlock({ title = 'Reorder', hint }) {
  const { colors } = useTheme();

  return (
    <View style={styles.block}>
      <AppText style={[styles.title, { color: colors.text }]}>{title}</AppText>
      {hint ? <AppText style={[styles.hint, { color: colors.textMuted }]}>{hint}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    marginBottom: 14,
    marginTop: 0,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  hint: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    marginTop: 6,
  },
});
