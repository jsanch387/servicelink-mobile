import { StyleSheet, View } from 'react-native';
import { SkeletonBox, SurfaceCard } from '../../../components/ui';

/**
 * Placeholder while account settings bundle loads (matches section-outside-title layout).
 */
export function AccountSettingsScreenSkeleton() {
  return (
    <View accessibilityLabel="Loading account" style={styles.column}>
      <View style={[styles.section, styles.sectionFirst]}>
        <View style={styles.sectionTitleRow}>
          <SkeletonBox borderRadius={6} height={15} pulse width={64} />
        </View>
        <SurfaceCard padding="sm">
          <SkeletonBox borderRadius={6} height={16} pulse width="72%" />
        </SurfaceCard>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <SkeletonBox borderRadius={6} height={15} pulse width={88} />
          <SkeletonBox borderRadius={8} height={28} pulse width={28} />
        </View>
        <SurfaceCard style={styles.card}>
          <SkeletonBox borderRadius={8} height={14} pulse width="100%" />
          <SkeletonBox borderRadius={8} height={14} pulse style={{ marginTop: 6 }} width="78%" />
          <SkeletonBox borderRadius={12} height={48} pulse style={{ marginTop: 12 }} width="100%" />
          <View style={styles.editRow}>
            <SkeletonBox borderRadius={6} height={13} pulse width={64} />
          </View>
        </SurfaceCard>
      </View>

      <View style={styles.section}>
        <SkeletonBox borderRadius={6} height={15} pulse style={{ marginBottom: 8 }} width={72} />
        <SurfaceCard style={styles.card}>
          <SkeletonBox borderRadius={8} height={14} pulse width="100%" />
          <SkeletonBox borderRadius={8} height={14} pulse style={{ marginTop: 8 }} width="92%" />
          <SkeletonBox borderRadius={14} height={48} pulse style={{ marginTop: 16 }} width="100%" />
        </SurfaceCard>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <SkeletonBox borderRadius={6} height={15} pulse width={88} />
        </View>
        <SurfaceCard style={styles.card}>
          <SkeletonBox borderRadius={8} height={14} pulse width="100%" />
          <SkeletonBox borderRadius={8} height={14} pulse style={{ marginTop: 8 }} width="80%" />
          <SkeletonBox borderRadius={14} height={48} pulse style={{ marginTop: 16 }} width="100%" />
        </SurfaceCard>
      </View>

      <SkeletonBox borderRadius={14} height={48} pulse style={{ marginTop: 28 }} width="100%" />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 0,
  },
  column: {
    alignSelf: 'stretch',
    width: '100%',
  },
  editRow: {
    alignItems: 'flex-end',
    marginTop: 12,
  },
  section: {
    marginTop: 22,
  },
  sectionFirst: {
    marginTop: 0,
  },
  sectionTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    minHeight: 24,
  },
});
