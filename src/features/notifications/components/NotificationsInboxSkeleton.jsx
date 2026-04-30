import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SkeletonBox, SurfaceCard } from '../../../components/ui';
import { useTheme } from '../../../theme';

function SkeletonRow({ dividerStyle, showDivider }) {
  return (
    <View>
      <View style={styles.row}>
        <SkeletonBox borderRadius={999} height={32} pulse width={32} />
        <View style={styles.content}>
          <View style={styles.topLine}>
            <SkeletonBox borderRadius={8} height={16} pulse style={styles.titleBone} width="70%" />
            <SkeletonBox borderRadius={6} height={12} pulse width={48} />
          </View>
          <SkeletonBox borderRadius={8} height={13} pulse style={{ marginTop: 6 }} width="100%" />
          <SkeletonBox borderRadius={8} height={13} pulse style={{ marginTop: 6 }} width="82%" />
        </View>
        <SkeletonBox borderRadius={99} height={8} pulse style={{ marginTop: 6 }} width={8} />
      </View>
      {showDivider ? <View style={dividerStyle} /> : null}
    </View>
  );
}

/**
 * Placeholder while inbox rows load (matches Recent activity card + rows).
 */
export function NotificationsInboxSkeleton() {
  const { colors } = useTheme();
  const dividerStyle = useMemo(
    () => [
      styles.divider,
      {
        backgroundColor: colors.border,
      },
    ],
    [colors.border],
  );

  return (
    <SurfaceCard accessibilityLabel="Loading notifications" style={styles.card}>
      <View style={styles.inboxTitleRow}>
        <SkeletonBox borderRadius={8} height={18} pulse width={140} />
        <SkeletonBox borderRadius={999} height={26} pulse width={88} />
      </View>
      {[0, 1, 2, 3].map((k) => (
        <SkeletonRow key={k} dividerStyle={dividerStyle} showDivider={k < 3} />
      ))}
      <SkeletonBox borderRadius={14} height={48} pulse style={{ marginTop: 8 }} width="100%" />
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 2,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginTop: 2,
    opacity: 0.7,
  },
  inboxTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  row: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 2,
    paddingVertical: 12,
  },
  titleBone: {
    marginRight: 8,
  },
  topLine: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
