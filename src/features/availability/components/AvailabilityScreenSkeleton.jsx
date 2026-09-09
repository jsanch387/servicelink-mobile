import { StyleSheet, View } from 'react-native';
import { SkeletonBox, SurfaceCard } from '../../../components/ui';

/**
 * Placeholder while business + availability rows load (matches the schedule tab).
 */
export function AvailabilityScreenSkeleton() {
  return (
    <View style={styles.column}>
      {[0, 1, 2, 3, 4, 5, 6].map((k) => (
        <SurfaceCard key={k} outlined={false} padding="none" style={styles.dayCard}>
          <View style={styles.dayTop}>
            <SkeletonBox borderRadius={6} height={16} pulse width={36} />
            <SkeletonBox borderRadius={16} height={28} pulse width={48} />
          </View>
          <SkeletonBox borderRadius={8} height={40} pulse style={{ marginTop: 10 }} width="100%" />
        </SurfaceCard>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    alignSelf: 'stretch',
    gap: 10,
  },
  dayCard: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  dayTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
