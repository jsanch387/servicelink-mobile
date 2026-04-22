import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { AppText, InlineCardError, SurfaceCard } from '../../../components/ui';
import { useTheme } from '../../../theme';
import { localYyyyMmDd } from '../../home/utils/bookingStart';
import { layoutPlannerDay, isPlannerCancelledStatus } from '../utils/plannerDayLayout';

/** Wide enough for "12:00" at 10pt; clock is right-aligned inside so colons line up. */
const HOUR_LABEL_CLOCK_WIDTH = 40;

/**
 * @param {Date} _anchorDate calendar day (reserved for locale-specific formatting)
 * @param {number} hour0to23
 * @returns {{ clock: string; meridiem: string }}
 */
function plannerHourClockMeridiem(_anchorDate, hour0to23) {
  const h = ((hour0to23 % 24) + 24) % 24;
  const isPm = h >= 12;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return { clock: `${h12}:00`, meridiem: isPm ? 'PM' : 'AM' };
}

/**
 * @param {{
 *   plannerDate: Date;
 *   onShiftDay: (delta: number) => void;
 *   bookings: import('../api/bookings').BookingRow[];
 *   isLoading: boolean;
 *   businessError: string | null;
 *   dayError: string | null;
 *   hasBusiness: boolean;
 *   onRefresh: () => void;
 *   refreshing: boolean;
 *   showNowLine?: boolean;
 * }} props
 */
export function BookingsDayPlanner({
  plannerDate,
  onShiftDay,
  bookings,
  isLoading,
  businessError,
  dayError,
  hasBusiness,
  onRefresh,
  refreshing,
  showNowLine = true,
}) {
  const { colors } = useTheme();

  const todayStr = useMemo(() => localYyyyMmDd(), []);
  const dateStr = useMemo(() => localYyyyMmDd(plannerDate), [plannerDate]);
  const isToday = dateStr === todayStr;

  const title = useMemo(
    () =>
      plannerDate.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    [plannerDate],
  );

  const layout = useMemo(() => layoutPlannerDay(bookings), [bookings]);

  const nowLineTop = useMemo(() => {
    if (!isToday || !showNowLine) {
      return null;
    }
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const top = (nowMin - layout.windowStartMin) * layout.pxPerMinute;
    if (top < 0 || top > layout.timelineHeight) {
      return null;
    }
    return top;
  }, [isToday, showNowLine, layout.windowStartMin, layout.pxPerMinute, layout.timelineHeight]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
        },
        header: {
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 12,
          paddingHorizontal: 0,
        },
        navHit: {
          padding: 10,
        },
        titleWrap: {
          alignItems: 'center',
          flex: 1,
        },
        title: {
          color: colors.text,
          fontSize: 17,
          fontWeight: '700',
          letterSpacing: -0.2,
          textAlign: 'center',
        },
        todayPill: {
          backgroundColor: colors.shellElevated,
          borderRadius: 6,
          marginTop: 4,
          paddingHorizontal: 8,
          paddingVertical: 2,
        },
        todayPillText: {
          color: colors.textMuted,
          fontSize: 11,
          fontWeight: '700',
        },
        errorBlock: {
          marginBottom: 12,
        },
        scroll: {
          flex: 1,
        },
        scrollContent: {
          paddingBottom: 120,
        },
        timelineRow: {
          flexDirection: 'row',
          minWidth: 0,
        },
        /** Narrower column + grid nudge: spine sits closer to labels; `paddingLeft` unchanged */
        timeGutter: {
          backgroundColor: colors.shell,
          paddingLeft: 8,
          paddingTop: 0,
          /** Fits clock column + AM/PM + inset from spine overlap */
          width: 76,
        },
        hourLabelCell: {
          alignItems: 'flex-start',
          height: layout.hourHeightPx,
          justifyContent: 'flex-start',
          paddingLeft: 0,
          /** Clears grid `marginLeft` overlap so AM/PM isn’t covered */
          paddingRight: 6,
          paddingTop: 0,
        },
        hourLabelRow: {
          alignItems: 'flex-start',
          flexDirection: 'row',
          marginTop: Platform.select({ android: -3, ios: -2 }),
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
        nowLineRow: {
          alignItems: 'center',
          flexDirection: 'row',
          left: 0,
          pointerEvents: 'none',
          position: 'absolute',
          right: 0,
          zIndex: 10,
        },
        nowDot: {
          backgroundColor: colors.danger,
          borderRadius: 3,
          height: 6,
          marginLeft: -1,
          width: 6,
        },
        nowBar: {
          backgroundColor: colors.danger,
          flex: 1,
          height: StyleSheet.hairlineWidth,
          marginRight: 0,
          opacity: 0.85,
        },
        block: {
          borderRadius: 8,
          overflow: 'hidden',
          paddingHorizontal: 8,
          paddingVertical: 6,
          position: 'absolute',
        },
        blockDefault: {
          backgroundColor: colors.shellElevated,
          borderColor: colors.borderStrong,
          borderWidth: 1,
        },
        blockCancelled: {
          backgroundColor: colors.shell,
          borderColor: colors.border,
          borderStyle: 'dashed',
          borderWidth: 1,
          opacity: 0.75,
        },
        blockTitle: {
          color: colors.inputText,
          fontSize: 13,
          fontWeight: '700',
        },
        blockTitleCancelled: {
          color: colors.textMuted,
          textDecorationLine: 'line-through',
        },
        blockSub: {
          color: colors.textMuted,
          fontSize: 11,
          fontWeight: '500',
          marginTop: 2,
        },
        blockStatus: {
          color: colors.textMuted,
          fontSize: 10,
          fontWeight: '700',
          marginTop: 4,
          textTransform: 'uppercase',
        },
        emptyWrap: {
          alignItems: 'center',
          marginTop: 48,
          paddingHorizontal: 8,
        },
        emptyTitle: {
          color: colors.textSecondary,
          fontSize: 16,
          fontWeight: '700',
        },
        emptyBody: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '500',
          lineHeight: 20,
          marginTop: 8,
          textAlign: 'center',
        },
        loadingBox: {
          alignItems: 'center',
          marginTop: 48,
        },
      }),
    [colors, layout.hourHeightPx],
  );

  if (!hasBusiness) {
    return (
      <View style={styles.root}>
        <View style={styles.emptyWrap}>
          <AppText style={styles.emptyTitle}>No business profile</AppText>
          <AppText style={styles.emptyBody}>
            Once your business is set up in ServiceLink, the planner will load appointments here.
          </AppText>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          colors={[colors.accent]}
          onRefresh={onRefresh}
          refreshing={refreshing}
          tintColor={colors.accent}
        />
      }
      showsVerticalScrollIndicator={false}
      style={styles.scroll}
    >
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Previous day"
          hitSlop={12}
          onPress={() => onShiftDay(-1)}
          style={styles.navHit}
        >
          <Ionicons color={colors.tabBarActive} name="chevron-back" size={26} />
        </Pressable>
        <View style={styles.titleWrap}>
          <AppText style={styles.title}>{title}</AppText>
          {isToday ? (
            <View style={styles.todayPill}>
              <AppText style={styles.todayPillText}>Today</AppText>
            </View>
          ) : null}
        </View>
        <Pressable
          accessibilityLabel="Next day"
          hitSlop={12}
          onPress={() => onShiftDay(1)}
          style={styles.navHit}
        >
          <Ionicons color={colors.tabBarActive} name="chevron-forward" size={26} />
        </Pressable>
      </View>

      {businessError ? (
        <View style={styles.errorBlock}>
          <SurfaceCard>
            <InlineCardError message={businessError} />
          </SurfaceCard>
        </View>
      ) : null}
      {dayError ? (
        <View style={styles.errorBlock}>
          <SurfaceCard>
            <InlineCardError message={dayError} />
          </SurfaceCard>
        </View>
      ) : null}

      {isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      ) : !dayError && bookings.length === 0 ? (
        <View style={styles.emptyWrap}>
          <AppText style={styles.emptyTitle}>No appointments this day</AppText>
          <AppText style={styles.emptyBody}>
            All statuses are shown. Use the arrows to check other days.
          </AppText>
        </View>
      ) : !dayError ? (
        <View style={styles.timelineRow}>
          <View style={styles.timeGutter}>
            {layout.hourLabels.map((h) => {
              const { clock, meridiem } = plannerHourClockMeridiem(plannerDate, h);
              return (
                <View key={h} style={[styles.hourLabelCell, { height: layout.hourHeightPx }]}>
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
          <View style={[styles.gridWrap, { height: layout.timelineHeight }]}>
            {layout.hourLabels.map((_, i) => (
              <View
                key={`rule-${i}`}
                pointerEvents="none"
                style={[styles.hourRule, { top: i * layout.hourHeightPx }]}
              />
            ))}
            <View pointerEvents="none" style={styles.bottomRule} />

            {nowLineTop != null ? (
              <View style={[styles.nowLineRow, { top: nowLineTop }]}>
                <View style={styles.nowDot} />
                <View style={styles.nowBar} />
              </View>
            ) : null}

            {layout.blocks.map((b) => {
              const cancelled = isPlannerCancelledStatus(b.booking.status);
              const service = b.booking.service_name?.trim() || 'Service';
              const customer = b.booking.customer_name?.trim() || '';
              return (
                <View
                  key={b.booking.id}
                  style={[
                    styles.block,
                    cancelled ? styles.blockCancelled : styles.blockDefault,
                    {
                      height: b.height,
                      left: `${b.leftPct}%`,
                      top: b.top,
                      width: `${b.widthPct}%`,
                    },
                  ]}
                >
                  <AppText
                    numberOfLines={2}
                    style={[styles.blockTitle, cancelled && styles.blockTitleCancelled]}
                  >
                    {service}
                  </AppText>
                  {customer ? (
                    <AppText numberOfLines={1} style={styles.blockSub}>
                      {customer}
                    </AppText>
                  ) : null}
                  <AppText style={styles.blockStatus}>{String(b.booking.status ?? '')}</AppText>
                </View>
              );
            })}
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}
