import { StyleSheet, View } from 'react-native';
import { SkeletonBox } from '../../../../components/ui';
import { useTheme } from '../../../../theme';

const WELL = 36;
const ROW_GAP = 44;

function ActivityRowSkeleton({ isLast }) {
  const { colors } = useTheme();

  return (
    <View style={styles.block}>
      <View style={styles.head}>
        <SkeletonBox
          backgroundColor={colors.textMuted}
          borderRadius={10}
          height={WELL}
          pulse
          width={WELL}
        />
        <View style={styles.copy}>
          <SkeletonBox backgroundColor={colors.textMuted} borderRadius={6} height={14} pulse width="42%" />
          <SkeletonBox backgroundColor={colors.textMuted} borderRadius={6} height={11} pulse width="56%" />
        </View>
      </View>
      {isLast ? null : (
        <View style={styles.railWrap}>
          <SkeletonBox
            backgroundColor={colors.textMuted}
            borderRadius={1}
            height={ROW_GAP - 16}
            pulse
            width={2}
          />
        </View>
      )}
    </View>
  );
}

export function BookingActivitySkeleton() {
  return (
    <>
      <ActivityRowSkeleton />
      <ActivityRowSkeleton />
      <ActivityRowSkeleton isLast />
    </>
  );
}

const styles = StyleSheet.create({
  block: {
    width: '100%',
  },
  head: {
    alignItems: 'center',
    flexDirection: 'row',
    width: '100%',
  },
  copy: {
    flex: 1,
    gap: 8,
    minWidth: 0,
    paddingLeft: 16,
  },
  railWrap: {
    alignItems: 'center',
    height: ROW_GAP,
    justifyContent: 'center',
    width: WELL,
  },
});
