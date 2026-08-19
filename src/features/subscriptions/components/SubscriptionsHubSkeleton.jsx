import { StyleSheet, View } from 'react-native';
import { SkeletonBox, SurfaceCard } from '../../../components/ui';

function PlanCardSkeleton() {
  return (
    <SurfaceCard padding="none" style={styles.card}>
      <View style={styles.planTop}>
        <View style={styles.planText}>
          <SkeletonBox borderRadius={8} height={18} pulse width="58%" />
          <SkeletonBox borderRadius={8} height={14} pulse style={{ marginTop: 10 }} width="36%" />
        </View>
      </View>
      <View style={styles.pillRow}>
        <SkeletonBox borderRadius={999} height={24} pulse width={72} />
        <SkeletonBox borderRadius={999} height={24} pulse width={84} />
      </View>
      <View style={styles.planFooter}>
        <SkeletonBox borderRadius={8} height={13} pulse width="42%" />
        <SkeletonBox borderRadius={6} height={16} pulse width={16} />
      </View>
    </SurfaceCard>
  );
}

function MemberCardSkeleton() {
  return (
    <SurfaceCard padding="none" style={styles.card}>
      <View style={styles.memberTop}>
        <View style={styles.planText}>
          <SkeletonBox borderRadius={8} height={16} pulse width="52%" />
          <SkeletonBox borderRadius={8} height={12} pulse style={{ marginTop: 8 }} width="34%" />
        </View>
        <SkeletonBox borderRadius={999} height={22} pulse width={64} />
      </View>
      <View style={styles.planFooter}>
        <SkeletonBox borderRadius={8} height={13} pulse width="48%" />
        <SkeletonBox borderRadius={6} height={16} pulse width={16} />
      </View>
    </SurfaceCard>
  );
}

/**
 * Hub loading placeholder — tabs + plan/member cards.
 */
export function SubscriptionsHubSkeleton() {
  return (
    <View
      accessibilityLabel="Loading subscriptions"
      accessibilityRole="progressbar"
      accessible
      style={styles.wrap}
    >
      <View style={styles.tabsTrack}>
        <SkeletonBox borderRadius={11} height={36} pulse style={{ flex: 1 }} />
        <SkeletonBox borderRadius={11} height={36} pulse style={{ flex: 1 }} />
      </View>
      <SkeletonBox borderRadius={8} height={16} pulse style={{ marginBottom: 4 }} width="44%" />
      <View style={styles.list}>
        <PlanCardSkeleton />
        <PlanCardSkeleton />
        <PlanCardSkeleton />
      </View>
    </View>
  );
}

/**
 * Shared member-card stack for hub subscribers tab / plan subscribers list.
 */
export function SubscriptionMemberListSkeleton({ count = 4 }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, index) => (
        <MemberCardSkeleton key={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'stretch',
    gap: 14,
  },
  tabsTrack: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 2,
  },
  list: {
    gap: 12,
  },
  card: {
    gap: 12,
    marginBottom: 0,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  planTop: {
    width: '100%',
  },
  planText: {
    flex: 1,
    minWidth: 0,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  planFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  memberTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
});
