import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';
import { AppointmentCountMarkers, appointmentDayFillOpacity } from './AppointmentCountMarkers';
import { AppText } from './AppText';
import { PeriodNav } from './PeriodNav';
import {
  buildMonthWeekGrid,
  parseLocalYyyyMmDd,
  startOfLocalDay,
  toLocalYyyyMmDd,
} from './calendarDateKey';

/** Keep in sync with `features/availability/booking/constants` when used for booking. */
const DEFAULT_MAX_DAYS_AHEAD = 365;

const WEEK_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEK_HEADERS_COMPACT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/**
 * Month calendar: weekday headers + rows aligned to Sun–Sat; only in-month dates are shown.
 *
 * @param {{
 *   selectedDateKey?: string | null;
 *   onSelectDateKey: (isoLocalYyyyMmDd: string) => void;
 *   selectionMode?: 'single' | 'range';
 *   selectionAppearance?: 'fill' | 'outline';
 *   rangeStartKey?: string | null;
 *   rangeEndKey?: string | null;
 *   minDate?: Date;
 *   maxDate?: Date;
 *   isDateUnavailable?: (d: Date) => boolean;
 *   bookingCountByDateKey?: Record<string, number>;
 *   onVisibleMonthChange?: (monthStart: Date) => void;
 *   plainNav?: boolean;
 * }} props
 */
export function CalendarMonthPicker({
  selectedDateKey = null,
  onSelectDateKey,
  selectionMode = 'single',
  selectionAppearance = 'fill',
  rangeStartKey = null,
  rangeEndKey = null,
  minDate: minDateProp,
  maxDate: maxDateProp,
  isDateUnavailable,
  bookingCountByDateKey,
  onVisibleMonthChange,
  plainNav = false,
}) {
  const { colors, isDark } = useTheme();
  const ownerCalendar = bookingCountByDateKey !== undefined;
  const isRangeMode = selectionMode === 'range';

  const today = useMemo(() => startOfLocalDay(new Date()), []);
  const todayKey = useMemo(() => toLocalYyyyMmDd(today), [today]);
  const minDate = useMemo(() => startOfLocalDay(minDateProp ?? today), [minDateProp, today]);
  const maxDate = useMemo(() => {
    if (maxDateProp) return startOfLocalDay(maxDateProp);
    const d = new Date(today);
    d.setDate(d.getDate() + DEFAULT_MAX_DAYS_AHEAD);
    return startOfLocalDay(d);
  }, [maxDateProp, today]);

  const anchorKeyForMonth = isRangeMode ? rangeStartKey || rangeEndKey : selectedDateKey;

  const [visibleMonthStart, setVisibleMonthStart] = useState(() => {
    const s = parseLocalYyyyMmDd(anchorKeyForMonth);
    if (s) return new Date(s.getFullYear(), s.getMonth(), 1);
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  useEffect(() => {
    const s = parseLocalYyyyMmDd(anchorKeyForMonth);
    if (!s) return;
    setVisibleMonthStart(new Date(s.getFullYear(), s.getMonth(), 1));
  }, [anchorKeyForMonth]);

  useEffect(() => {
    onVisibleMonthChange?.(visibleMonthStart);
  }, [visibleMonthStart, onVisibleMonthChange]);

  const monthLabel = useMemo(
    () =>
      visibleMonthStart.toLocaleString(undefined, {
        month: 'long',
        year: 'numeric',
      }),
    [visibleMonthStart],
  );

  const weeks = useMemo(() => {
    const y = visibleMonthStart.getFullYear();
    const m = visibleMonthStart.getMonth();
    return buildMonthWeekGrid(y, m);
  }, [visibleMonthStart]);

  const canGoPrev = useMemo(() => {
    const first = new Date(visibleMonthStart);
    const prevLast = new Date(first);
    prevLast.setDate(0);
    return prevLast >= minDate;
  }, [visibleMonthStart, minDate]);

  const canGoNext = useMemo(() => {
    const nextStart = new Date(visibleMonthStart);
    nextStart.setMonth(nextStart.getMonth() + 1);
    const maxMonthStart = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
    return nextStart <= maxMonthStart;
  }, [visibleMonthStart, maxDate]);

  const goPrevMonth = useCallback(() => {
    if (!canGoPrev) return;
    setVisibleMonthStart((d) => {
      const n = new Date(d);
      n.setMonth(n.getMonth() - 1);
      return new Date(n.getFullYear(), n.getMonth(), 1);
    });
  }, [canGoPrev]);

  const goNextMonth = useCallback(() => {
    if (!canGoNext) return;
    setVisibleMonthStart((d) => {
      const n = new Date(d);
      n.setMonth(n.getMonth() + 1);
      return new Date(n.getFullYear(), n.getMonth(), 1);
    });
  }, [canGoNext]);

  const busyFillColor = useMemo(() => (isDark ? 'rgba(250,250,250,' : 'rgba(10,10,10,'), [isDark]);
  const rangeFill = useMemo(
    () => (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'),
    [isDark],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        periodNav: {
          marginBottom: ownerCalendar ? 0 : 12,
        },
        monthDivider: {
          backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
          height: StyleSheet.hairlineWidth,
          marginBottom: 16,
          marginHorizontal: 7,
          marginTop: 4,
        },
        weekHeaderRow: {
          flexDirection: 'row',
          marginBottom: ownerCalendar ? 10 : 8,
        },
        weekHeaderCell: {
          alignItems: 'center',
          flex: 1,
        },
        weekHeaderText: {
          color: ownerCalendar
            ? isDark
              ? 'rgba(250,250,250,0.78)'
              : colors.textSecondary
            : colors.textMuted,
          fontSize: ownerCalendar ? 12 : 11,
          fontWeight: ownerCalendar ? '700' : '600',
        },
        monthBody: {
          gap: ownerCalendar ? 8 : 4,
        },
        weekRow: {
          flexDirection: 'row',
        },
        dayCell: {
          alignItems: 'center',
          flex: 1,
          justifyContent: 'center',
          minHeight: ownerCalendar ? 56 : 44,
          paddingVertical: 2,
        },
        daySpacer: {
          flex: 1,
          minHeight: ownerCalendar ? 56 : 44,
        },
        dayInner: {
          alignItems: 'center',
          alignSelf: ownerCalendar ? 'stretch' : 'center',
          borderRadius: ownerCalendar ? 14 : 10,
          height: ownerCalendar ? 52 : 42,
          justifyContent: 'center',
          marginHorizontal: ownerCalendar ? 2 : 0,
          width: ownerCalendar ? undefined : 40,
          zIndex: 1,
        },
        dayInnerSelected: {
          backgroundColor: ownerCalendar ? colors.buttonPrimaryBg : '#FFFFFF',
        },
        dayInnerSelectedOutline: {
          backgroundColor: 'transparent',
          borderColor: isDark ? 'rgba(255,255,255,0.55)' : colors.borderStrong,
          borderWidth: 1.5,
        },
        rangeTrack: {
          backgroundColor: rangeFill,
          bottom: ownerCalendar ? 2 : 1,
          position: 'absolute',
          top: ownerCalendar ? 2 : 1,
        },
        rangeTrackMiddle: {
          left: 0,
          right: 0,
        },
        dayInnerToday: {
          borderColor: colors.borderStrong,
          borderWidth: 1,
        },
        dayNum: {
          fontSize: ownerCalendar ? 16 : 15,
          fontWeight: '600',
        },
        dayNumDisabled: {
          color: colors.textMuted,
          opacity: 0.35,
        },
        dayNumActive: {
          color: colors.text,
        },
        dayNumSelected: {
          color: ownerCalendar ? colors.buttonPrimaryText : '#000000',
        },
        dayNumSelectedOutline: {
          color: colors.text,
        },
        markerRow: {
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 3,
          minHeight: 8,
        },
      }),
    [colors, isDark, ownerCalendar, rangeFill],
  );

  const isDisabled = useCallback(
    (d) => {
      const day = startOfLocalDay(d);
      if (day < minDate || day > maxDate) return true;
      if (typeof isDateUnavailable === 'function' && isDateUnavailable(d)) {
        return true;
      }
      return false;
    },
    [isDateUnavailable, minDate, maxDate],
  );

  const firstAvailableDayKey = useMemo(() => {
    for (const week of weeks) {
      for (const date of week) {
        if (!date) continue;
        if (!isDisabled(date)) {
          return toLocalYyyyMmDd(date);
        }
      }
    }
    return null;
  }, [weeks, isDisabled]);

  const weekHeaders = ownerCalendar ? WEEK_HEADERS_COMPACT : WEEK_HEADERS;
  const rangeRadius = ownerCalendar ? 12 : 10;

  const effectiveRangeEnd = rangeEndKey || (rangeStartKey && !rangeEndKey ? rangeStartKey : null);
  const hasCompleteRange = Boolean(
    isRangeMode && rangeStartKey && rangeEndKey && rangeStartKey !== rangeEndKey,
  );
  const firstInRangeKey = hasCompleteRange
    ? (() => {
        const d = parseLocalYyyyMmDd(rangeStartKey);
        if (!d) return '';
        d.setDate(d.getDate() + 1);
        return toLocalYyyyMmDd(d);
      })()
    : '';
  const lastInRangeKey = hasCompleteRange
    ? (() => {
        const d = parseLocalYyyyMmDd(rangeEndKey);
        if (!d) return '';
        d.setDate(d.getDate() - 1);
        return toLocalYyyyMmDd(d);
      })()
    : '';

  return (
    <View>
      <PeriodNav
        appearance={plainNav ? 'plain' : 'bar'}
        label={monthLabel}
        nextDisabled={!canGoNext}
        nextLabel="Next month"
        previousDisabled={!canGoPrev}
        previousLabel="Previous month"
        style={styles.periodNav}
        onNext={goNextMonth}
        onPrevious={goPrevMonth}
      />

      {ownerCalendar ? <View style={styles.monthDivider} /> : null}

      <View style={styles.weekHeaderRow}>
        {weekHeaders.map((w, index) => (
          <View key={`${w}-${index}`} style={styles.weekHeaderCell}>
            <AppText style={styles.weekHeaderText}>{w}</AppText>
          </View>
        ))}
      </View>

      <View style={styles.monthBody}>
        {weeks.map((week, rowIndex) => (
          <View key={`week-${rowIndex}`} style={styles.weekRow}>
            {week.map((date, colIndex) => {
              if (!date) {
                return <View key={`pad-${rowIndex}-${colIndex}`} style={styles.daySpacer} />;
              }

              const key = toLocalYyyyMmDd(date);
              const disabled = isDisabled(date);
              const isToday = key === todayKey;
              const bookingCount = bookingCountByDateKey?.[key] ?? 0;
              const hasBookings = bookingCount > 0;

              let selected = false;
              let inRange = false;
              if (isRangeMode) {
                const start = rangeStartKey;
                const end = effectiveRangeEnd;
                selected = Boolean(start && (key === start || (end && key === end)));
                inRange = Boolean(hasCompleteRange && key > rangeStartKey && key < rangeEndKey);
              } else {
                selected = selectedDateKey === key;
              }

              const showRangeTrack = !disabled && inRange;
              const roundRangeLeft = inRange && (key === firstInRangeKey || colIndex === 0);
              const roundRangeRight = inRange && (key === lastInRangeKey || colIndex === 6);

              const fillOpacity =
                ownerCalendar && hasBookings && !disabled && !selected && !inRange
                  ? appointmentDayFillOpacity(bookingCount)
                  : 0;

              return (
                <View key={key} style={styles.dayCell}>
                  {showRangeTrack ? (
                    <View
                      pointerEvents="none"
                      style={[
                        styles.rangeTrack,
                        styles.rangeTrackMiddle,
                        roundRangeLeft
                          ? {
                              borderBottomLeftRadius: rangeRadius,
                              borderTopLeftRadius: rangeRadius,
                            }
                          : null,
                        roundRangeRight
                          ? {
                              borderBottomRightRadius: rangeRadius,
                              borderTopRightRadius: rangeRadius,
                            }
                          : null,
                      ]}
                    />
                  ) : null}
                  <Pressable
                    accessibilityLabel={`${key}${isToday ? ', today' : ''}${selected ? ', selected' : ''}${inRange ? ', in range' : ''}${hasBookings ? `, ${bookingCount} appointment${bookingCount === 1 ? '' : 's'}` : ''}${disabled ? ', unavailable' : ''}`}
                    accessibilityRole="button"
                    accessibilityState={{ disabled, selected: selected || inRange }}
                    disabled={disabled}
                    style={[
                      styles.dayInner,
                      fillOpacity > 0
                        ? { backgroundColor: `${busyFillColor}${fillOpacity})` }
                        : null,
                      isToday && !selected && !inRange && !disabled && !ownerCalendar
                        ? styles.dayInnerToday
                        : null,
                      selected && !disabled ? styles.dayInnerSelected : null,
                    ]}
                    testID={
                      !disabled && key === firstAvailableDayKey
                        ? 'calendar-day-first-available'
                        : `calendar-day-${key}`
                    }
                    onPress={() => onSelectDateKey(key)}
                  >
                    <AppText
                      style={[
                        styles.dayNum,
                        selected && !disabled
                          ? styles.dayNumSelected
                          : disabled
                            ? styles.dayNumDisabled
                            : styles.dayNumActive,
                      ]}
                    >
                      {date.getDate()}
                    </AppText>
                    <View style={styles.markerRow}>
                      {hasBookings && !disabled ? (
                        <AppointmentCountMarkers
                          count={bookingCount}
                          inverted={selected && ownerCalendar}
                        />
                      ) : null}
                    </View>
                  </Pressable>
                </View>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}
