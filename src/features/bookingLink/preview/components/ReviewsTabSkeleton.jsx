import { StyleSheet, View } from 'react-native';
import { SkeletonBox } from '../../../../components/ui';

/** Minimal placeholder while reviews load — no fake rating/breakdown UI. */
export function ReviewsTabSkeleton() {
  return (
    <View style={styles.wrap}>
      <SkeletonBox borderRadius={8} height={18} pulse width="40%" />
      <SkeletonBox borderRadius={8} height={14} pulse style={styles.line} width="88%" />
      <SkeletonBox borderRadius={8} height={14} pulse style={styles.line} width="72%" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: 10,
    paddingTop: 8,
  },
  line: {
    marginTop: 0,
  },
});
