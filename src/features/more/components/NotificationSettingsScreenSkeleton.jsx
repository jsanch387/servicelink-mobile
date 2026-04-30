import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SkeletonBox, SurfaceCard } from '../../../components/ui';
import { useTheme } from '../../../theme';

function ToggleRowSkeleton({ dividerStyle, showDivider }) {
  return (
    <View>
      <View style={styles.row}>
        <View style={styles.textBlock}>
          <SkeletonBox borderRadius={8} height={16} pulse width="48%" />
          <SkeletonBox borderRadius={6} height={12} pulse style={{ marginTop: 6 }} width="92%" />
          <SkeletonBox borderRadius={6} height={12} pulse style={{ marginTop: 6 }} width="78%" />
        </View>
        <SkeletonBox borderRadius={16} height={28} pulse width={50} />
      </View>
      {showDivider ? <View style={dividerStyle} /> : null}
    </View>
  );
}

/** Placeholder while notification preferences load (matches push card + toggle rows). */
export function NotificationSettingsScreenSkeleton() {
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
    <SurfaceCard accessibilityLabel="Loading notification settings" style={styles.card}>
      <SkeletonBox borderRadius={8} height={18} pulse width="56%" />
      <SkeletonBox borderRadius={8} height={13} pulse style={{ marginTop: 10 }} width="100%" />
      <SkeletonBox borderRadius={8} height={13} pulse style={{ marginTop: 8 }} width="88%" />
      <View style={styles.blockSpacer} />
      {[0, 1, 2, 3].map((k) => (
        <ToggleRowSkeleton key={k} dividerStyle={dividerStyle} showDivider={k < 3} />
      ))}
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  blockSpacer: {
    height: 12,
  },
  card: {
    gap: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginTop: 2,
    opacity: 0.7,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
    paddingVertical: 12,
  },
  textBlock: {
    flex: 1,
    minWidth: 0,
  },
});
