import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { FROSTED_ICON_WELL_SIZE, SkeletonBox, frostedSurfaceColors } from '../../../components/ui';
import { useTheme } from '../../../theme';

const ROW_WIDTHS = [
  { title: '48%', sub: '62%', amount: 64 },
  { title: '36%', sub: '54%', amount: 56 },
  { title: '44%', sub: '70%', amount: 72 },
  { title: '40%', sub: '50%', amount: 60 },
];

/**
 * Balance + list bones that match the loaded Transactions layout.
 */
export function PaymentsTransactionsSkeleton() {
  const { isDark } = useTheme();
  const frost = frostedSurfaceColors(isDark);

  const stylesLocal = useMemo(
    () =>
      StyleSheet.create({
        stack: {
          gap: 16,
        },
        balanceCard: {
          backgroundColor: frost.backgroundColor,
          borderColor: frost.borderColor,
          borderRadius: 16,
          borderWidth: StyleSheet.hairlineWidth,
          paddingHorizontal: 20,
          paddingVertical: 20,
        },
        pendingRow: {
          alignItems: 'center',
          borderTopColor: frost.borderColor,
          borderTopWidth: StyleSheet.hairlineWidth,
          flexDirection: 'row',
          marginTop: 16,
          paddingTop: 14,
          width: '100%',
        },
        pendingLabelCol: {
          flex: 1,
          minWidth: 0,
        },
        list: {
          gap: 0,
        },
        dayHead: {
          paddingBottom: 4,
          paddingTop: 4,
        },
      }),
    [frost.backgroundColor, frost.borderColor],
  );

  return (
    <View
      accessibilityLabel="Loading transactions"
      accessibilityRole="progressbar"
      accessible
      style={stylesLocal.stack}
      testID="payments-transactions"
    >
      <View style={stylesLocal.balanceCard}>
        <SkeletonBox borderRadius={6} height={13} pulse width={72} />
        <SkeletonBox borderRadius={10} height={34} pulse style={{ marginTop: 10 }} width={168} />
        <View style={stylesLocal.pendingRow}>
          <View style={stylesLocal.pendingLabelCol}>
            <SkeletonBox borderRadius={6} height={14} pulse width={88} />
          </View>
          <SkeletonBox borderRadius={6} height={14} pulse width={64} />
        </View>
      </View>

      <View style={stylesLocal.list}>
        <View style={stylesLocal.dayHead}>
          <SkeletonBox borderRadius={6} height={13} pulse width={56} />
        </View>
        {ROW_WIDTHS.map((widths) => (
          <View key={widths.title} style={styles.row}>
            <SkeletonBox borderRadius={10} height={FROSTED_ICON_WELL_SIZE} pulse width={FROSTED_ICON_WELL_SIZE} />
            <View style={styles.copy}>
              <SkeletonBox borderRadius={6} height={14} pulse width={widths.title} />
              <SkeletonBox borderRadius={6} height={12} pulse style={{ marginTop: 8 }} width={widths.sub} />
            </View>
            <SkeletonBox borderRadius={6} height={14} pulse width={widths.amount} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingVertical: 13,
    width: '100%',
  },
  copy: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 12,
  },
});
