import { StyleSheet, View } from 'react-native';
import { SkeletonBox, SurfaceCard } from '../../../components/ui';
import { useTheme } from '../../../theme';

function ExpenseRowSkeleton({ showDividerBelow }) {
  const { colors } = useTheme();

  return (
    <View>
      <View style={styles.row}>
        <View style={styles.copy}>
          <SkeletonBox borderRadius={6} height={14} pulse width="62%" />
          <SkeletonBox borderRadius={6} height={11} pulse style={styles.meta} width="34%" />
        </View>
        <View style={styles.amountCol}>
          <SkeletonBox borderRadius={6} height={14} pulse width={52} />
          <SkeletonBox borderRadius={6} height={11} pulse style={styles.meta} width={44} />
        </View>
      </View>
      {showDividerBelow ? (
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
      ) : null}
    </View>
  );
}

function MonthBlock() {
  return (
    <View style={styles.month}>
      <View style={styles.header}>
        <SkeletonBox borderRadius={6} height={16} pulse width={96} />
        <SkeletonBox borderRadius={6} height={14} pulse width={48} />
      </View>
      <SurfaceCard outlined={false} padding="none" style={styles.card}>
        <ExpenseRowSkeleton showDividerBelow />
        <ExpenseRowSkeleton showDividerBelow />
        <ExpenseRowSkeleton showDividerBelow={false} />
      </SurfaceCard>
    </View>
  );
}

export function ExpenseListSkeleton() {
  return (
    <View style={styles.stack}>
      <MonthBlock />
      <MonthBlock />
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 22,
  },
  month: {
    gap: 8,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  card: {
    overflow: 'hidden',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    width: '100%',
  },
  copy: {
    flex: 1,
    minWidth: 0,
    paddingRight: 12,
  },
  amountCol: {
    alignItems: 'flex-end',
  },
  meta: {
    marginTop: 6,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 16,
  },
});
