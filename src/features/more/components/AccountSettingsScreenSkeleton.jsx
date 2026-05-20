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
          <SkeletonBox borderRadius={6} height={15} pulse width={72} />
        </View>
        <SurfaceCard padding="sm" style={styles.card}>
          <View style={styles.signedInRow}>
            <SkeletonBox borderRadius={10} height={40} pulse width={40} />
            <View style={styles.signedInText}>
              <SkeletonBox borderRadius={6} height={13} pulse width="78%" />
              <SkeletonBox
                borderRadius={6}
                height={12}
                pulse
                style={{ marginTop: 4 }}
                width="52%"
              />
            </View>
          </View>
        </SurfaceCard>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <SkeletonBox borderRadius={6} height={15} pulse width={72} />
          <SkeletonBox borderRadius={8} height={28} pulse width={28} />
        </View>
        <SurfaceCard style={styles.card}>
          <SkeletonBox borderRadius={8} height={14} pulse width="100%" />
          <SkeletonBox borderRadius={8} height={14} pulse style={{ marginTop: 8 }} width="92%" />
          <SkeletonBox borderRadius={12} height={52} pulse style={{ marginTop: 14 }} width="100%" />
          <View style={styles.linkActions}>
            <SkeletonBox borderRadius={8} height={18} pulse width={64} />
            <SkeletonBox borderRadius={8} height={18} pulse width={88} />
          </View>
        </SurfaceCard>
      </View>

      <View style={styles.section}>
        <SkeletonBox borderRadius={6} height={15} pulse style={{ marginBottom: 8 }} width={140} />
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
          <SkeletonBox borderRadius={8} height={16} pulse width="55%" />
          <SkeletonBox borderRadius={8} height={14} pulse style={{ marginTop: 10 }} width="100%" />
          <SkeletonBox borderRadius={14} height={48} pulse style={{ marginTop: 16 }} width="100%" />
        </SurfaceCard>
      </View>

      <SkeletonBox borderRadius={14} height={48} pulse style={{ marginTop: 28 }} width="100%" />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 14,
  },
  column: {
    alignSelf: 'stretch',
    width: '100%',
  },
  linkActions: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
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
  signedInRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 0,
  },
  signedInText: {
    flex: 1,
    gap: 2,
    justifyContent: 'center',
  },
});
