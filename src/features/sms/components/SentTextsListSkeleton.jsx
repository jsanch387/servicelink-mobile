import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SkeletonBox } from '../../../components/ui';
import { useTheme } from '../../../theme';

/** Compact collapsed-row skeleton (title + status/phone; no message body). */
function SkeletonDayBlock({ dividerColor, rowCount }) {
  return (
    <View>
      <SkeletonBox borderRadius={6} height={14} pulse style={styles.sectionLabel} width="22%" />
      {Array.from({ length: rowCount }, (_, key) => (
        <View key={key}>
          <View style={styles.row}>
            <SkeletonBox borderRadius={16} height={32} pulse width={32} />
            <View style={styles.copy}>
              <View style={styles.topRow}>
                <SkeletonBox borderRadius={6} height={14} pulse width="44%" />
                <SkeletonBox borderRadius={6} height={12} pulse width="14%" />
              </View>
              <SkeletonBox borderRadius={6} height={12} pulse width="62%" />
            </View>
          </View>
          {key < rowCount - 1 ? (
            <View style={[styles.divider, { backgroundColor: dividerColor }]} />
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignSelf: 'stretch',
    gap: 16,
    width: '100%',
  },
  sectionLabel: {
    marginBottom: 4,
  },
  row: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
  },
  copy: {
    flex: 1,
    gap: 6,
    minWidth: 0,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 44,
    opacity: 0.55,
    width: '100%',
  },
});

export function SentTextsListSkeleton() {
  const { colors } = useTheme();

  const dividerColor = useMemo(() => colors.border, [colors.border]);

  return (
    <View accessibilityLabel="Loading sent messages" style={styles.root}>
      <SkeletonDayBlock dividerColor={dividerColor} rowCount={2} />
      <SkeletonDayBlock dividerColor={dividerColor} rowCount={1} />
    </View>
  );
}
