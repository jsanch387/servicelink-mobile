import { StyleSheet, View } from 'react-native';
import { SkeletonBox, SurfaceCard } from '../../../components/ui';

/**
 * Placeholder while business + availability rows load (matches screen structure loosely).
 */
export function AvailabilityScreenSkeleton() {
  return (
    <View style={styles.column}>
      <SurfaceCard style={styles.card}>
        <View style={styles.toggleRow}>
          <View style={styles.toggleText}>
            <SkeletonBox borderRadius={8} height={18} pulse width="72%" />
            <SkeletonBox borderRadius={8} height={14} pulse style={{ marginTop: 8 }} width="88%" />
          </View>
          <SkeletonBox borderRadius={16} height={32} pulse width={52} />
        </View>
      </SurfaceCard>

      <SkeletonBox
        borderRadius={8}
        height={20}
        pulse
        style={{ marginBottom: 10, marginTop: 8 }}
        width="40%"
      />

      <SurfaceCard style={styles.scheduleCard}>
        {[0, 1, 2, 3, 4, 5, 6].map((k) => (
          <View key={k} style={[styles.dayBlock, k === 6 && styles.dayBlockLast]}>
            <View style={styles.dayTop}>
              <SkeletonBox borderRadius={6} height={16} pulse width={36} />
              <SkeletonBox borderRadius={16} height={28} pulse width={48} />
            </View>
            <SkeletonBox
              borderRadius={8}
              height={40}
              pulse
              style={{ marginTop: 10 }}
              width="100%"
            />
          </View>
        ))}
      </SurfaceCard>

      <SkeletonBox
        borderRadius={8}
        height={20}
        pulse
        style={{ marginBottom: 10, marginTop: 8 }}
        width="28%"
      />

      <SurfaceCard style={styles.card}>
        <View style={styles.timeOffHeader}>
          <SkeletonBox borderRadius={8} height={14} pulse width="70%" />
          <SkeletonBox borderRadius={12} height={36} pulse width={72} />
        </View>
        <SkeletonBox borderRadius={8} height={14} pulse style={{ marginTop: 14 }} width="55%" />
      </SurfaceCard>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 0,
  },
  column: {
    alignSelf: 'stretch',
    gap: 0,
  },
  dayBlock: {
    borderBottomColor: 'rgba(128,128,128,0.15)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 14,
  },
  dayBlockLast: {
    borderBottomWidth: 0,
  },
  dayTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scheduleCard: {
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  timeOffHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  toggleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  toggleText: {
    flex: 1,
    minWidth: 0,
  },
});
