import { StyleSheet, View } from 'react-native';
import { SkeletonBox, SurfaceCard } from '../../../components/ui';

/**
 * Placeholder matching {@link BookingCard} list/agenda layout.
 *
 * @param {{ count?: number }} [props]
 */
export function BookingCardSkeleton({ count = 1 }) {
  return (
    <View style={styles.column}>
      {Array.from({ length: count }, (_, k) => (
        <SurfaceCard key={k} style={styles.card}>
          <SkeletonBox borderRadius={8} height={18} pulse width="72%" />
          <SkeletonBox borderRadius={8} height={14} pulse style={styles.lineGap} width="50%" />
          <SkeletonBox borderRadius={8} height={14} pulse style={styles.lineGapSm} width="40%" />
        </SurfaceCard>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    gap: 12,
  },
  card: {
    marginBottom: 0,
  },
  lineGap: {
    marginTop: 14,
  },
  lineGapSm: {
    marginTop: 10,
  },
});
