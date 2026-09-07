import { StyleSheet, View } from 'react-native';
import { SkeletonBox } from '../../../../components/ui';
import { useTheme } from '../../../../theme';

const WELL = 30;
const ROW_PAD_H = 16;
const ICON_GAP = 12;
const RAIL_H = 34;
const CARD_PAD_V = 18;

function ActivityRowSkeleton({ isFirst, isLast }) {
  const { colors } = useTheme();

  return (
    <View style={styles.block}>
      <View style={[styles.row, isFirst && styles.rowFirst, isLast && styles.rowLast]}>
        <SkeletonBox
          backgroundColor={colors.textMuted}
          borderRadius={8}
          height={WELL}
          pulse
          width={WELL}
        />
        <View style={styles.copy}>
          <View style={styles.line}>
            <SkeletonBox
              backgroundColor={colors.textMuted}
              borderRadius={5}
              height={11}
              pulse
              width="34%"
            />
            <SkeletonBox
              backgroundColor={colors.textMuted}
              borderRadius={5}
              height={11}
              pulse
              width={36}
            />
          </View>
          <View style={styles.line}>
            <SkeletonBox
              backgroundColor={colors.textMuted}
              borderRadius={5}
              height={10}
              pulse
              width="22%"
            />
            <SkeletonBox
              backgroundColor={colors.textMuted}
              borderRadius={5}
              height={10}
              pulse
              width="28%"
            />
          </View>
        </View>
      </View>
      {isLast ? null : (
        <View style={styles.railWrap}>
          <SkeletonBox
            backgroundColor={colors.textMuted}
            borderRadius={1}
            height={RAIL_H}
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
      <ActivityRowSkeleton isFirst />
      <ActivityRowSkeleton />
      <ActivityRowSkeleton isLast />
    </>
  );
}

const styles = StyleSheet.create({
  block: {
    width: '100%',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: ROW_PAD_H,
    width: '100%',
  },
  rowFirst: {
    paddingTop: CARD_PAD_V,
  },
  rowLast: {
    paddingBottom: CARD_PAD_V,
  },
  copy: {
    flex: 1,
    gap: 8,
    minWidth: 0,
    paddingLeft: ICON_GAP,
  },
  line: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  railWrap: {
    alignItems: 'center',
    height: RAIL_H,
    justifyContent: 'center',
    marginLeft: ROW_PAD_H,
    width: WELL,
  },
});
