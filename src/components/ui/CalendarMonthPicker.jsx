import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';
import { AppText } from './AppText';
import {
  buildMonthWeekGrid,
  parseLocalYyyyMmDd,
  startOfLocalDay,
  toLocalYyyyMmDd,
} from './calendarDateKey';

/** Keep in sync with `features/availability/booking/constants` when used for booking. */
const DEFAULT_MAX_DAYS_AHEAD = 365;

const WEEK_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Month calendar: weekday headers + rows aligned to Sun–Sat; only in-month dates are shown.
 *
 * @param {{
 *   selectedDateKey: string | null;
 *   onSelectDateKey: (isoLocalYyyyMmDd: string) => void;
 *   minDate?: Date;
 *   maxDate?: Date;
 *   isDateUnavailable?: (d: Date) => boolean;
 * }} props
 */
export function CalendarMonthPicker({
  selectedDateKey,
  onSelectDateKey,
  minDate: minDateProp,
  maxDate: maxDateProp,
  isDateUnavailable,
}) {
  const { colors } = useTheme();

  const today = useMemo(() => startOfLocalDay(new Date()), []);
  const todayKey = useMemo(() => toLocalYyyyMmDd(today), [today]);
  const minDate = useMemo(() => startOfLocalDay(minDateProp ?? today), [minDateProp, today]);
  const maxDate = useMemo(() => {
    if (maxDateProp) return startOfLocalDay(maxDateProp);
    const d = new Date(today);
    d.setDate(d.getDate() + DEFAULT_MAX_DAYS_AHEAD);
    return startOfLocalDay(d);
  }, [maxDateProp, today]);

  const [visibleMonthStart, setVisibleMonthStart] = useState(() => {
    const s = parseLocalYyyyMmDd(selectedDateKey);
    if (s) return new Date(s.getFullYear(), s.getMonth(), 1);
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  useEffect(() => {
    const s = parseLocalYyyyMmDd(selectedDateKey);
    if (!s) return;
    setVisibleMonthStart(new Date(s.getFullYear(), s.getMonth(), 1));
  }, [selectedDateKey]);

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

  const styles = useMemo(
    () =>
      StyleSheet.create({
        navRow: {
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 14,
        },
        navHit: {
          alignItems: 'center',
          borderRadius: 12,
          height: 40,
          justifyContent: 'center',
          width: 40,
        },
        monthTitle: {
          color: colors.text,
          fontSize: 17,
          fontWeight: '700',
          letterSpacing: -0.2,
        },
        weekHeaderRow: {
          flexDirection: 'row',
          marginBottom: 8,
        },
        weekHeaderCell: {
          alignItems: 'center',
          flex: 1,
        },
        weekHeaderText: {
          color: colors.textMuted,
          fontSize: 11,
          fontWeight: '600',
        },
        monthBody: {
          gap: 4,
        },
        weekRow: {
          flexDirection: 'row',
        },
        dayCell: {
          alignItems: 'center',
          flex: 1,
          justifyContent: 'center',
          minHeight: 44,
          paddingVertical: 2,
        },
        daySpacer: {
          flex: 1,
          minHeight: 44,
        },
        dayInner: {
          alignItems: 'center',
          borderRadius: 10,
          height: 40,
          justifyContent: 'center',
          width: 40,
        },
        dayInnerSelected: {
          backgroundColor: '#FFFFFF',
        },
        dayInnerToday: {
          borderColor: colors.borderStrong,
          borderWidth: 1,
        },
        dayNum: {
          fontSize: 15,
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
          color: '#000000',
        },
      }),
    [colors],
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

  return (
    <View>
      <View style={styles.navRow}>
        <Pressable
          accessibilityLabel="Previous month"
          accessibilityRole="button"
          accessibilityState={{ disabled: !canGoPrev }}
          disabled={!canGoPrev}
          hitSlop={8}
          style={[styles.navHit, { opacity: canGoPrev ? 1 : 0.35 }]}
          onPress={goPrevMonth}
        >
          <Ionicons color={colors.text} name="chevron-back" size={22} />
        </Pressable>
        <AppText style={styles.monthTitle}>{monthLabel}</AppText>
        <Pressable
          accessibilityLabel="Next month"
          accessibilityRole="button"
          accessibilityState={{ disabled: !canGoNext }}
          disabled={!canGoNext}
          hitSlop={8}
          style={[styles.navHit, { opacity: canGoNext ? 1 : 0.35 }]}
          onPress={goNextMonth}
        >
          <Ionicons color={colors.text} name="chevron-forward" size={22} />
        </Pressable>
      </View>

      <View style={styles.weekHeaderRow}>
        {WEEK_HEADERS.map((w) => (
          <View key={w} style={styles.weekHeaderCell}>
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
              const selected = selectedDateKey === key;
              const isToday = key === todayKey;
              const disabled = isDisabled(date);

              return (
                <View key={key} style={styles.dayCell}>
                  <Pressable
                    accessibilityLabel={`${key}${isToday ? ', today' : ''}${selected ? ', selected' : ''}${disabled ? ', unavailable' : ''}`}
                    accessibilityRole="button"
                    accessibilityState={{ disabled, selected }}
                    disabled={disabled}
                    style={[
                      styles.dayInner,
                      isToday && !selected && !disabled ? styles.dayInnerToday : null,
                      selected && !disabled ? styles.dayInnerSelected : null,
                    ]}
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
