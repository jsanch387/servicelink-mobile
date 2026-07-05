import { Platform, StyleSheet, View } from 'react-native';
import { AppText, SkeletonBox } from '../../../components/ui';
import { useTheme } from '../../../theme';
import { getPlannerDayMetrics } from '../utils/plannerDayLayout';

const HOUR_LABEL_CLOCK_WIDTH = 40;

/** @param {number} hour0to23 */
function plannerHourClockMeridiem(hour0to23) {
  const h = ((hour0to23 % 24) + 24) % 24;
  const isPm = h >= 12;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return { clock: `${h12}:00`, meridiem: isPm ? 'PM' : 'AM' };
}

/** Placeholder blocks — offsets from planner start hour (5 AM). */
const SKELETON_BLOCKS = [
  { startHourOffset: 2, heightHours: 1.25, width: '88%' },
  { startHourOffset: 5.5, heightHours: 1.5, width: '76%' },
  { startHourOffset: 9, heightHours: 1, width: '82%' },
];

/**
 * Day planner loading state — hour grid + pulsing appointment blocks (not list cards).
 */
export function BookingsDayPlannerSkeleton() {
  const { colors } = useTheme();
  const metrics = getPlannerDayMetrics();
  const hourHeightPx = metrics.PIXELS_PER_HOUR;
  const hours = Array.from({ length: metrics.numHours }, (_, i) => metrics.START_HOUR + i);

  const styles = StyleSheet.create({
    timelineRow: {
      flexDirection: 'row',
      minWidth: 0,
    },
    timeGutter: {
      backgroundColor: colors.shell,
      paddingLeft: 8,
      width: 76,
    },
    hourLabelCell: {
      alignItems: 'flex-start',
      height: hourHeightPx,
      justifyContent: 'flex-start',
      paddingRight: 6,
    },
    hourLabelRow: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      marginTop: Platform.select({ android: -3, ios: -2 }),
      opacity: 0.35,
    },
    hourLabelClock: {
      color: colors.textSecondary,
      fontSize: 10,
      fontVariant: ['tabular-nums'],
      fontWeight: '500',
      lineHeight: 12,
      textAlign: 'right',
      width: HOUR_LABEL_CLOCK_WIDTH,
      ...Platform.select({
        android: { includeFontPadding: false },
        default: {},
      }),
    },
    hourLabelMeridiem: {
      color: colors.textMuted,
      fontSize: 10,
      fontWeight: '600',
      letterSpacing: 0.2,
      lineHeight: 12,
      marginLeft: 3,
      textTransform: 'uppercase',
      ...Platform.select({
        android: { includeFontPadding: false },
        default: {},
      }),
    },
    gridWrap: {
      backgroundColor: colors.shell,
      borderLeftColor: colors.border,
      borderLeftWidth: StyleSheet.hairlineWidth,
      flex: 1,
      marginLeft: -5,
      minWidth: 0,
      position: 'relative',
    },
    hourRule: {
      backgroundColor: colors.border,
      height: StyleSheet.hairlineWidth,
      left: 0,
      position: 'absolute',
      right: 0,
    },
    bottomRule: {
      backgroundColor: colors.border,
      bottom: 0,
      height: StyleSheet.hairlineWidth,
      left: 0,
      position: 'absolute',
      right: 0,
    },
    block: {
      borderRadius: 9,
      left: 8,
      overflow: 'hidden',
      position: 'absolute',
      right: 8,
    },
  });

  return (
    <View
      accessibilityLabel="Loading day planner"
      accessibilityRole="progressbar"
      style={styles.timelineRow}
    >
      <View style={styles.timeGutter}>
        {hours.map((h) => {
          const { clock, meridiem } = plannerHourClockMeridiem(h);
          return (
            <View key={h} style={styles.hourLabelCell}>
              <View style={styles.hourLabelRow}>
                <AppText ellipsizeMode="clip" numberOfLines={1} style={styles.hourLabelClock}>
                  {clock}
                </AppText>
                <AppText numberOfLines={1} style={styles.hourLabelMeridiem}>
                  {meridiem}
                </AppText>
              </View>
            </View>
          );
        })}
      </View>
      <View style={[styles.gridWrap, { height: metrics.timelineHeightPx }]}>
        {hours.map((_, i) => (
          <View key={`rule-${i}`} style={[styles.hourRule, { top: i * hourHeightPx }]} />
        ))}
        <View pointerEvents="none" style={styles.bottomRule} />
        {SKELETON_BLOCKS.map((block, index) => (
          <SkeletonBox
            key={index}
            borderRadius={9}
            height={Math.round(block.heightHours * hourHeightPx)}
            pulse
            style={[
              styles.block,
              {
                top: Math.round(block.startHourOffset * hourHeightPx) + 6,
                width: block.width,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}
