import { StyleSheet, View } from 'react-native';
import { SkeletonBox, SurfaceCard } from '../../../components/ui';

/**
 * Placeholder while account settings bundle loads (matches subscription + link cards loosely).
 */
export function AccountSettingsScreenSkeleton() {
  return (
    <View accessibilityLabel="Loading account" style={styles.column}>
      <View style={styles.signedInBlock}>
        <SkeletonBox borderRadius={6} height={12} pulse width={88} />
        <SkeletonBox borderRadius={8} height={18} pulse style={{ marginTop: 8 }} width="72%" />
      </View>

      <SurfaceCard style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <SkeletonBox borderRadius={8} height={18} pulse width="52%" />
          <SkeletonBox borderRadius={999} height={26} pulse width={72} />
        </View>
        <View style={styles.planInner}>
          <View style={styles.planTierRow}>
            <SkeletonBox borderRadius={8} height={20} pulse width="40%" />
            <SkeletonBox borderRadius={8} height={18} pulse width={56} />
          </View>
        </View>
        <SkeletonBox borderRadius={8} height={14} pulse style={{ marginTop: 12 }} width="88%" />
        <SkeletonBox borderRadius={14} height={48} pulse style={{ marginTop: 14 }} width="100%" />
      </SurfaceCard>

      <SurfaceCard style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <SkeletonBox borderRadius={8} height={18} pulse width="36%" />
          <SkeletonBox borderRadius={8} height={28} pulse width={28} />
        </View>
        <SkeletonBox borderRadius={8} height={14} pulse style={{ marginTop: 6 }} width="100%" />
        <SkeletonBox borderRadius={8} height={14} pulse style={{ marginTop: 8 }} width="92%" />
        <SkeletonBox borderRadius={12} height={52} pulse style={{ marginTop: 14 }} width="100%" />
        <View style={styles.linkActions}>
          <SkeletonBox borderRadius={8} height={18} pulse width={64} />
          <SkeletonBox borderRadius={8} height={18} pulse width={88} />
        </View>
      </SurfaceCard>

      <SkeletonBox borderRadius={14} height={48} pulse width="100%" />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 14,
  },
  cardHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 24,
  },
  column: {
    alignSelf: 'stretch',
    gap: 16,
    width: '100%',
  },
  linkActions: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  planInner: {
    borderRadius: 12,
    gap: 10,
    paddingVertical: 4,
  },
  planTierRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signedInBlock: {
    gap: 4,
  },
});
