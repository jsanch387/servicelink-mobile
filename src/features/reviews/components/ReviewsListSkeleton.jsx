import { StyleSheet, View } from 'react-native';
import { SkeletonBox, SurfaceCard } from '../../../components/ui';

function ReviewsSummarySkeleton() {
  return (
    <SurfaceCard padding="md">
      <View style={summaryStyles.topRow}>
        <SkeletonBox borderRadius={8} height={44} pulse width={72} />
        <View style={summaryStyles.starsBlock}>
          <SkeletonBox borderRadius={8} height={18} pulse width="70%" />
          <SkeletonBox borderRadius={8} height={14} pulse style={{ marginTop: 8 }} width="40%" />
        </View>
      </View>
      <View style={summaryStyles.divider} />
      {[0, 1, 2, 3, 4].map((key) => (
        <View key={key} style={summaryStyles.breakdownRow}>
          <SkeletonBox borderRadius={6} height={12} pulse width={14} />
          <SkeletonBox borderRadius={4} height={8} pulse style={{ flex: 1 }} />
          <SkeletonBox borderRadius={6} height={12} pulse width={32} />
        </View>
      ))}
    </SurfaceCard>
  );
}

function ReviewsCardsSkeleton() {
  return (
    <View style={listStyles.column}>
      {[0, 1, 2].map((key) => (
        <SurfaceCard key={key} padding="md" style={listStyles.card}>
          <View style={listStyles.headerRow}>
            <View style={listStyles.nameBlock}>
              <SkeletonBox borderRadius={8} height={18} pulse width="58%" />
              <SkeletonBox
                borderRadius={8}
                height={11}
                pulse
                style={{ marginTop: 8 }}
                width="36%"
              />
            </View>
            <SkeletonBox borderRadius={8} height={14} pulse width={84} />
          </View>
          <SkeletonBox borderRadius={8} height={14} pulse style={{ marginTop: 14 }} width="92%" />
          <SkeletonBox borderRadius={8} height={14} pulse style={{ marginTop: 8 }} width="78%" />
        </SurfaceCard>
      ))}
    </View>
  );
}

export function ReviewsListSkeleton() {
  return (
    <View style={rootStyles.wrap}>
      <ReviewsSummarySkeleton />
      <ReviewsCardsSkeleton />
    </View>
  );
}

const rootStyles = StyleSheet.create({
  wrap: {
    gap: 16,
  },
});

const summaryStyles = StyleSheet.create({
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 16,
  },
  starsBlock: {
    flex: 1,
    minWidth: 0,
  },
  divider: {
    height: 18,
  },
  breakdownRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
});

const listStyles = StyleSheet.create({
  column: {
    gap: 12,
  },
  card: {
    marginBottom: 0,
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  nameBlock: {
    flex: 1,
    minWidth: 0,
  },
});
