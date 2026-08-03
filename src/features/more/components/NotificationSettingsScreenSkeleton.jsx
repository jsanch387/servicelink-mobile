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
        <SurfaceCard
          accessibilityLabel="Loading notification settings"
          padding="none"
          style={styles.card}
        >
          <View style={styles.notifyRow}>
            <SkeletonBox borderRadius={16} height={32} pulse width={32} />
            <View style={styles.copy}>
              <SkeletonBox borderRadius={6} height={14} pulse width="40%" />
              <SkeletonBox
                borderRadius={6}
                height={12}
                pulse
                style={{ marginTop: 6 }}
                width="78%"
              />
            </View>
          </View>
          <View style={dividerStyle} />
          <View style={styles.notifyRow}>
            <SkeletonBox borderRadius={16} height={32} pulse width={32} />
            <View style={styles.copy}>
              <SkeletonBox borderRadius={6} height={14} pulse width="32%" />
              <SkeletonBox
                borderRadius={6}
                height={12}
                pulse
                style={{ marginTop: 6 }}
                width="70%"
              />
            </View>
          </View>
        </SurfaceCard>
      </View>

      <View style={styles.section}>
        <SkeletonBox borderRadius={6} height={15} pulse style={styles.sectionLabel} width="40%" />
        <SurfaceCard padding="none" style={styles.card}>
          <View style={styles.notifyRow}>
            <SkeletonBox borderRadius={16} height={32} pulse width={32} />
            <View style={styles.copy}>
              <SkeletonBox borderRadius={6} height={14} pulse width="34%" />
              <SkeletonBox
                borderRadius={6}
                height={12}
                pulse
                style={{ marginTop: 6 }}
                width="84%"
              />
            </View>
          </View>
        </SurfaceCard>
      </View>

      <View style={styles.section}>
        <SkeletonBox borderRadius={6} height={15} pulse style={styles.sectionLabel} width="32%" />
        <SurfaceCard padding="none" style={styles.card}>
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
    overflow: 'hidden',
  },
  notifyRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 58,
    opacity: 0.55,
    width: '100%',
  },
  statusRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
});
