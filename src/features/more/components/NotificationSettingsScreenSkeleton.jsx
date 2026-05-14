import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SkeletonBox, SurfaceCard } from '../../../components/ui';
import { useTheme } from '../../../theme';

/** Placeholder while notification permission is read. */
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
    <View style={styles.root}>
      <View style={styles.sectionFirst}>
        <SkeletonBox borderRadius={6} height={15} pulse style={styles.sectionLabel} width="36%" />
        <SurfaceCard accessibilityLabel="Loading notification settings" style={styles.card}>
          <View style={styles.notifyRow}>
            <SkeletonBox borderRadius={6} height={16} pulse width="56%" />
            <SkeletonBox borderRadius={6} height={12} pulse style={{ marginTop: 6 }} width="88%" />
          </View>
          <View style={dividerStyle} />
          <View style={styles.notifyRow}>
            <SkeletonBox borderRadius={6} height={16} pulse width="44%" />
            <SkeletonBox borderRadius={6} height={12} pulse style={{ marginTop: 6 }} width="72%" />
          </View>
        </SurfaceCard>
      </View>

      <View style={styles.section}>
        <SkeletonBox borderRadius={6} height={15} pulse style={styles.sectionLabel} width="32%" />
        <SurfaceCard style={styles.card}>
          <View style={styles.statusRow}>
            <SkeletonBox borderRadius={6} height={15} pulse width="36%" />
            <SkeletonBox borderRadius={6} height={15} pulse width="22%" />
          </View>
        </SurfaceCard>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignSelf: 'stretch',
    width: '100%',
  },
  sectionFirst: {
    marginTop: 0,
  },
  section: {
    marginTop: 22,
  },
  sectionLabel: {
    marginBottom: 8,
  },
  card: {
    gap: 0,
  },
  notifyRow: {
    paddingVertical: 14,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    opacity: 0.55,
    width: '100%',
  },
  statusRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
});
