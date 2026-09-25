import { StyleSheet, View } from 'react-native';
import { SkeletonBox, SurfaceCard } from '../../../components/ui';

function CategoryRow({ width }) {
  return (
    <View style={styles.category}>
      <View style={styles.categoryTop}>
        <SkeletonBox borderRadius={6} height={14} pulse width={width} />
        <SkeletonBox borderRadius={6} height={14} pulse width={52} />
      </View>
      <SkeletonBox borderRadius={6} height={10} pulse width="100%" />
    </View>
  );
}

export function ExpenseOverviewSkeleton() {
  return (
    <View style={styles.stack}>
      <SurfaceCard outlined={false} style={styles.hero}>
        <View style={styles.amountRow}>
          <SkeletonBox borderRadius={8} height={40} pulse width="42%" />
          <SkeletonBox borderRadius={10} height={32} pulse width={88} />
        </View>
        <SkeletonBox borderRadius={999} height={26} pulse width={120} />
        <SkeletonBox borderRadius={12} height={132} pulse width="100%" />
      </SurfaceCard>
      <SurfaceCard outlined={false} style={styles.categories}>
        <CategoryRow width="34%" />
        <CategoryRow width="28%" />
        <CategoryRow width="40%" />
      </SurfaceCard>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 16,
  },
  hero: {
    gap: 14,
  },
  amountRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  categories: {
    gap: 16,
  },
  category: {
    gap: 8,
    width: '100%',
  },
  categoryTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
});
