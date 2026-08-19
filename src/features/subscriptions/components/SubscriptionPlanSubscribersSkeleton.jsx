import { StyleSheet, View } from 'react-native';
import { SkeletonBox } from '../../../components/ui';
import { SubscriptionMemberListSkeleton } from './SubscriptionsHubSkeleton';

/**
 * Plan subscribers list loading placeholder.
 */
export function SubscriptionPlanSubscribersSkeleton() {
  return (
    <View
      accessibilityLabel="Loading subscribers"
      accessibilityRole="progressbar"
      accessible
      style={styles.wrap}
    >
      <View style={styles.pills}>
        <SkeletonBox borderRadius={999} height={32} pulse width={78} />
        <SkeletonBox borderRadius={999} height={32} pulse width={96} />
      </View>
      <SubscriptionMemberListSkeleton count={5} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'stretch',
    gap: 14,
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 2,
  },
});
