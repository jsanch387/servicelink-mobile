import { StyleSheet, View } from 'react-native';
import { SkeletonBox, SurfaceCard } from '../../../components/ui';
import { ReviewsGoogleConnectCardSkeleton } from './ReviewsGoogleConnectCard';

function ReviewsSummarySkeleton() {
  return (
    <SurfaceCard padding="md">
      <View style={summaryStyles.topRow}>
        <SkeletonBox borderRadius={8} height={44} pulse width={72} />
        <View style={summaryStyles.starsBlock}>
          <SkeletonBox borderRadius={8} height={18} pulse width="70%" />
          <SkeletonBox borderRadius={8} height={14} pulse style={{ marginTop: 8 }} width="40%" />
        </View>
        <SkeletonBox borderRadius={6} height={18} pulse width={18} />
      </View>
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

/**
 * @param {{ showGoogleConnect?: boolean }} [props]
 */
export function ReviewsListSkeleton({ showGoogleConnect = false }) {
  return (
    <View style={rootStyles.wrap}>
      <ReviewsSummarySkeleton />
      {showGoogleConnect ? <ReviewsGoogleConnectCardSkeleton /> : null}
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
