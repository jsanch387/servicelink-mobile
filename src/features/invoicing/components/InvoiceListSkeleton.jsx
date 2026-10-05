import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SkeletonBox, SurfaceCard } from '../../../components/ui';

function InvoiceCardSkeleton() {
  return (
    <SurfaceCard padding="none" style={styles.card}>
      <View style={styles.head}>
        <View style={styles.nameCol}>
          <SkeletonBox borderRadius={6} height={16} pulse width="58%" />
          <SkeletonBox borderRadius={6} height={12} pulse style={styles.meta} width="42%" />
        </View>
        <SkeletonBox borderRadius={999} height={18} pulse width={52} />
      </View>
      <View style={styles.stats}>
        <SkeletonBox borderRadius={6} height={14} pulse width="28%" />
        <SkeletonBox borderRadius={6} height={14} pulse width="22%" />
        <SkeletonBox borderRadius={6} height={14} pulse width="30%" />
      </View>
    </SurfaceCard>
  );
}

export function InvoiceListSkeleton() {
  const cards = useMemo(() => ['a', 'b', 'c'], []);
  return (
    <View style={styles.list}>
      {cards.map((key) => (
        <InvoiceCardSkeleton key={key} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 10,
  },
  card: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  head: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  nameCol: {
    flex: 1,
    minWidth: 0,
  },
  meta: {
    marginTop: 8,
  },
  stats: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 18,
    width: '100%',
  },
});
